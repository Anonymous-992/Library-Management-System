import ClearanceModel from "../models/clearance-form-model.js";
import UserModel from "../models/user-model.js";
import DepartementModel from "../models/departement-model.js";
import { ErrorHandlerService, paginationService, sendMail } from "../services/index.js";
import generateClearanceForm from "../services/clerance-form-pdf-genrator.js";
import { buildClearanceStatusEmail } from "../services/email-template-service.js";

class ClearanceController {
  async submitForm(req, res, next) {
    /* 1- AUTHENTICATED USER ONLY ALLOW */
    /* 2- VALIDATE REQUEST */
    /* 3- CLEARANCE REQUESTS 
        IF REQUEST ALREADY HAVE THEN CHECK STATUS OF REQUESTS
            i) IF IT PENDING THEN DON't Allow to submit other request
            ii) IF IT IS APPROVED THEN DON"T 
            ii9) IF IT IS REJECTED THEN SENDS THIS TO LIBRARIAAN

        IF NOT HAVE REQUEST ALREADY THEN
            SAVE IT INTO DB
            and SENDS TO LIBRARAIN

        */
    const { type, additionalInformation } = req.body;
    if (!type) {
      return next(
        ErrorHandlerService.validationError("Clearance Type is required !")
      );
    }
    try {
      /* CHECK ALREADY HAVE REQUESTS THEN GET LAST ONE REQUEST.... */
      console.log(req.userData._id);
      const alreadyExistRequest = await ClearanceModel.findOne({
        user: req.userData._id,
      })
        .sort({ createdAt: -1 })
        .limit(-1);
      console.log(alreadyExistRequest);
      if (alreadyExistRequest) {
        if (alreadyExistRequest.status === "Approved") {
          return next(
            ErrorHandlerService.badRequest("Your request is already approved !")
          );
        }
        if (alreadyExistRequest.status === "Pending") {
          return next(
            ErrorHandlerService.badRequest(
              "your previous request is pending already."
            )
          );
        }
      }
      /* SAVE REQUEST INTO DATABASE */
      const newRequest = new ClearanceModel({
        type,
        additionalInformation,
        user: req.userData._id,
      });
      await newRequest.save();

      /*TODO:  SEND REQUEST TO THE LIBRARIAN....... Optional(SEND EMAIL AS WELLL) */

      return res.status(201).json({
        message: "Request submitted successfully !",
      });
    } catch (error) {
      return next(error);
    }
  }
  

  async getClearanceRequestsByStudent(req, res, next) {
    try {
      const clearanceRequests = await ClearanceModel.find({
        user: req.userData._id,
      }).populate("user", "name");
      return res.status(200).json({ clearanceRequests });
    } catch (error) {
      next(error);
    }
  }

  async getClearanceRequests(req, res, next) {
    /* QUERY : 
        ROLE = "LIBRARIAN"," CLERK" ,"HOD"
        STATUS = "PENDING","APPROVED","REJECTED" ACCORDING TO ROLE
     */
    const { page, skip, limit } = paginationService(req);
    const { status } = req.query;
    const { role } = req.userData;
    console.log({ role, status });
    if (!status) {
      return next(ErrorHandlerService.badRequest("Please provide queries."));
    }

    try {
      let filter = {};
      let clearanceRequests = [];
      let totalRecords = 0;

      if (role === "Admin") {
        // Librarian/Admin: filter by librarian approval status only
        filter = {
          librarianApprovalStatus: status,
        };

        [clearanceRequests, totalRecords] = await Promise.all([
          ClearanceModel.find(filter, "-__v")
            .populate("user", "name email fatherName rollNumber")
            .skip(skip)
            .limit(limit)
            .exec(),
          ClearanceModel.countDocuments(filter).exec(),
        ]);
      } else if (role === "HOD") {
        // HOD: only see requests for students in their own department
        const departement = await DepartementModel.findOne({ hod: req.userData._id });
        if (!departement) {
          return res
            .status(200)
            .json({ clearanceRequests: [], page, limit, totalRecords: 0, totalPages: 0 });
        }

        const studentsInDept = await UserModel.find(
          { departement: departement._id },
          "_id"
        ).exec();
        const studentIds = studentsInDept.map((s) => s._id);

        filter = {
          hodApprovalStatus: status,
          user: { $in: studentIds },
        };

        [clearanceRequests, totalRecords] = await Promise.all([
          ClearanceModel.find(filter, "-__v")
            .populate("user", "name email fatherName rollNumber")
            .skip(skip)
            .limit(limit)
            .exec(),
          ClearanceModel.countDocuments(filter).exec(),
        ]);
      } else {
        return next(
          ErrorHandlerService.forbidden("Not allowed to view clearance requests")
        );
      }

      const totalPages = Math.ceil(totalRecords / limit);
      return res
        .status(200)
        .json({ clearanceRequests, page, limit, totalRecords, totalPages });
    } catch (error) {
      next(error);
    }
  }

  async handleClearanceRequest(req, res, next) {
    const { clearanceRequestID, status, reason } = req.body;
    const { role } = req.userData;

    // Validate request
    if (!clearanceRequestID || !status) {
      return next(ErrorHandlerService.validationError());
    }

    try {
      // Get clearance request
      const clearanceRequest = await ClearanceModel.findById(
        clearanceRequestID
      );
      if (!clearanceRequest) {
        return next(ErrorHandlerService.notFound());
      }

      // Get student
      const student = await UserModel.findById(clearanceRequest.user);
      if (!student) {
        return next(ErrorHandlerService.notFound("Student Not Found !"));
      }

      // Helper to build PDF data with student, department, admin, and HOD details
      const buildPdfData = async () => {
        const [adminUser, departement] = await Promise.all([
          UserModel.findOne({ role: "Admin" }),
          student.departement
            ? DepartementModel.findById(student.departement).populate("hod")
            : null,
        ]);

        const departmentName = departement?.name || "N/A";
        const hodUser = departement?.hod;
        const hodName = hodUser?.name || "N/A";
        const hodDesignation = `HOD, Department of ${departmentName}`;

        const adminName = adminUser?.name || "Library Admin";
        const adminDesignation = "Librarian";

        return {
          _id: clearanceRequest._id,
          type: clearanceRequest.type,
          studentName: student?.name,
          studentRollNumber: student?.rollNumber,
          departmentName,
          adminName,
          adminDesignation,
          hodName,
          hodDesignation,
        };
      };

      // Handle request based on authenticated role
      switch (role) {
        case "Admin":
          if (status === "Approved") {
            // Update librarian approval
            clearanceRequest.librarianApprovalStatus = "Approved";

            // If HOD has already approved, finalize clearance
            if (clearanceRequest.hodApprovalStatus === "Approved") {
              clearanceRequest.status = "Approved";

              // Generate PDF if not already generated
              if (!clearanceRequest.pdfLink) {
                const fileName = `${clearanceRequest._id}.pdf`;
                const pdfData = await buildPdfData();
                await generateClearanceForm(pdfData, fileName);
                clearanceRequest.pdfLink = `documents/${fileName}`;
              }

              // Disable student account after full approval
              student.accountStatus = "Disabled";
              await student.save();

              // Notify student about approval
              const html = buildClearanceStatusEmail({
                name: student.name,
                type: clearanceRequest.type,
                status: "Approved",
                requestId: clearanceRequest._id.toString(),
              });
              await sendMail({
                to: student.email,
                subject: "Your Clearance Request Has Been Approved",
                text: `Your ${clearanceRequest.type} clearance request has been approved.`,
                html,
              });
            }

            await clearanceRequest.save();
          } else {
            // Validate reason
            if (!reason) {
              return next(
                ErrorHandlerService.validationError(
                  "Please provide reason of rejection."
                )
              );
            }

            // Update clearance request status
            clearanceRequest.librarianApprovalStatus = "Rejected";
            clearanceRequest.status = "Rejected";
            clearanceRequest.rejectedReason = reason;
            await clearanceRequest.save();

            // Notify student about rejection
            const html = buildClearanceStatusEmail({
              name: student.name,
              type: clearanceRequest.type,
              status: "Rejected",
              requestId: clearanceRequest._id.toString(),
              reason,
            });
            await sendMail({
              to: student.email,
              subject: "Your Clearance Request Has Been Rejected",
              text: `Your ${clearanceRequest.type} clearance request has been rejected.`,
              html,
            });
          }
          break;
        case "HOD":
          if (status === "Approved") {
            // Update HOD approval
            clearanceRequest.hodApprovalStatus = "Approved";

            // If librarian has already approved, finalize clearance
            if (clearanceRequest.librarianApprovalStatus === "Approved") {
              clearanceRequest.status = "Approved";

              // Generate PDF if not already generated
              if (!clearanceRequest.pdfLink) {
                const fileName = `${clearanceRequest._id}.pdf`;
                const pdfData = await buildPdfData();
                await generateClearanceForm(pdfData, fileName);
                clearanceRequest.pdfLink = `documents/${fileName}`;
              }

              // Disable student account after full approval
              student.accountStatus = "Disabled";
              await student.save();

              // Notify student about approval
              const html = buildClearanceStatusEmail({
                name: student.name,
                type: clearanceRequest.type,
                status: "Approved",
                requestId: clearanceRequest._id.toString(),
              });
              await sendMail({
                to: student.email,
                subject: "Your Clearance Request Has Been Approved",
                text: `Your ${clearanceRequest.type} clearance request has been approved.`,
                html,
              });
            }

            await clearanceRequest.save();
          } else {
            // Validate reason
            if (!reason) {
              return next(
                ErrorHandlerService.validationError(
                  "Please provide reason of rejection."
                )
              );
            }

            // Update clearance request status
            clearanceRequest.hodApprovalStatus = "Rejected";
            clearanceRequest.status = "Rejected";
            clearanceRequest.rejectedReason = reason;
            await clearanceRequest.save();

            // Notify student about rejection
            const html = buildClearanceStatusEmail({
              name: student.name,
              type: clearanceRequest.type,
              status: "Rejected",
              requestId: clearanceRequest._id.toString(),
              reason,
            });
            await sendMail({
              to: student.email,
              subject: "Your Clearance Request Has Been Rejected",
              text: `Your ${clearanceRequest.type} clearance request has been rejected.`,
              html,
            });
          }
          break;
        default:
          return next(ErrorHandlerService.forbidden("Invalid role"));
      }

      // Send response
      return res
        .status(200)
        .json({ message: "Clearance request processed successfully." });
    } catch (error) {
      return next(error);
    }
  }
}

export default new ClearanceController();
