import { useState, useRef } from "react";
import "./issuebook.scss";
import {
  getBookInfo,
  getUserInfo,
  issueBook,
  getAllStudents,
  getAllTeachers,
  getAllBooks,
  BASE_URL,
} from "../../../http";
import defaultCover from "../../../assets/cover404.jpg";
import { toast } from "react-hot-toast";
import { formatDate } from "../../../utils/formatDate";
const IssueBook = () => {
  const [userData, setUserData] = useState(null);
  const [bookData, setBookData] = useState(null);

  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [activeStudentField, setActiveStudentField] = useState(null);
  const studentSearchTimeout = useRef(null);

  const [bookSuggestions, setBookSuggestions] = useState([]);
  const bookSearchTimeout = useRef(null);

  const searchStudent = (e) => {
    e.preventDefault();
    const promise = getUserInfo({
      email: e.target.email.value,
      rollNumber: e.target.rollNumber.value,
    });
    toast.promise(promise, {
      loading: "Loading...",
      success: (data) => {
        setUserData(data?.data);
        setStudentSuggestions([]);
        setActiveStudentField(null);
        /* CLEAR INPUT VALUE */
        e.target.email.value = "";
        e.target.rollNumber.value = "";
        return "Student searched successfully..";
      },
      error: (err) => {
        console.log(err);
        const msg = err?.response?.data?.message;
        if (msg === "User Not Found") {
          return "No result found";
        }
        return msg || "Something went wrong !";
      },
    });
  };

  const handleStudentInputChange = (e, field) => {
    const value = e.target.value;
    setActiveStudentField(field);

    if (studentSearchTimeout.current) {
      clearTimeout(studentSearchTimeout.current);
    }

    if (!value.trim()) {
      setStudentSuggestions([]);
      return;
    }

    studentSearchTimeout.current = setTimeout(async () => {
      try {
        if (field === "email") {
          const [studentsRes, teachersRes] = await Promise.all([
            getAllStudents(value, "", "", 1),
            getAllTeachers(value, "", 1),
          ]);
          const students = studentsRes?.data?.students || [];
          const teachers = teachersRes?.data?.teachers || [];
          setStudentSuggestions([...students, ...teachers]);
        } else {
          const { data } = await getAllStudents("", "", value, 1);
          setStudentSuggestions(data?.students || []);
        }
      } catch (error) {
        console.log(error);
      }
    }, 300);
  };

  const handleSelectStudentSuggestion = (student, field) => {
    setStudentSuggestions([]);
    setActiveStudentField(null);
    const promise = getUserInfo({
      email: field === "email" ? student?.email : "",
      rollNumber: field === "rollNumber" ? student?.rollNumber : "",
    });
    toast.promise(promise, {
      loading: "Loading...",
      success: (data) => {
        setUserData(data?.data);
        return "Student selected successfully..";
      },
      error: (err) => {
        console.log();
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const searchBook = (e) => {
    e.preventDefault();
    const value = e.target.ISBN.value.trim();
    if (!value) return;

    const isISBNLike = /^[0-9-]+$/.test(value);

    if (isISBNLike) {
      const promise = getBookInfo({
        ISBN: value,
      });
      toast.promise(promise, {
        loading: "Loading...",
        success: (data) => {
          setBookData(data?.data);
          setBookSuggestions([]);
          e.target.ISBN.value = "";
          return "Book searched successfully..";
        },
        error: (err) => {
          console.log(err);
          const msg = err?.response?.data?.message;
          if (msg === "Book Not Found") {
            return "No result found";
          }
          return msg || "Something went wrong !";
        },
      });
    } else {
      const promise = (async () => {
        const { data } = await getAllBooks(
          { ISBN: "", title: value, status: "", category: "" },
          1,
          1
        );
        const firstBook = data?.books?.[0];
        if (!firstBook) {
          const error = new Error("Book Not Found");
          error.response = { data: { message: "Book Not Found" } };
          throw error;
        }
        return getBookInfo({ ISBN: firstBook.ISBN });
      })();

      toast.promise(promise, {
        loading: "Loading...",
        success: (data) => {
          setBookData(data?.data);
          setBookSuggestions([]);
          e.target.ISBN.value = "";
          return "Book searched successfully..";
        },
        error: (err) => {
          console.log();
          return err?.response?.data?.message || "Something went wrong !";
        },
      });
    }
  };

  const handleBookInputChange = (e) => {
    const value = e.target.value;

    if (bookSearchTimeout.current) {
      clearTimeout(bookSearchTimeout.current);
    }

    if (!value.trim()) {
      setBookSuggestions([]);
      return;
    }

    bookSearchTimeout.current = setTimeout(async () => {
      try {
        const trimmed = value.trim();
        const isISBNLike = /^[0-9-]+$/.test(trimmed);
        const query = isISBNLike
          ? { ISBN: trimmed, title: "", status: "", category: "" }
          : { ISBN: "", title: trimmed, status: "", category: "" };
        const { data } = await getAllBooks(query, 1, 5);
        setBookSuggestions(data?.books || []);
      } catch (error) {
        console.log(error);
      }
    }, 300);
  };

  const handleSelectBookSuggestion = (book) => {
    setBookSuggestions([]);
    const promise = getBookInfo({
      ISBN: book?.ISBN,
    });
    toast.promise(promise, {
      loading: "Loading...",
      success: (data) => {
        setBookData(data?.data);
        return "Book selected successfully..";
      },
      error: (err) => {
        console.log();
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleIssueBook = () => {
    /* CHECK USER AND BOOK FOUND OR NOT ?  */
    if (!userData || !bookData) {
      toast.error("Please select both book and user first !");
      return;
    }
    /* CHECK IF USER ALREADY BORROWED BOOKS AND EXCEED LIMIT */
    if (userData?.hasExceededLimit) {
      toast.error(`Limit exceeded !`);
      return;
    }
    const quantity =
      typeof bookData?.book?.quantity === "number"
        ? bookData.book.quantity
        : 0;
    if (quantity <= 0) {
      toast.error("Book is currently unavailable!");
      return;
    }
    /* CHECK SAME USER RESERVED ? */
    if (bookData?.book?.status === "Reserved") {
      if (userData?.user?.email !== bookData?.reservedAlready?.user?.email) {
        toast.error("Book reserved by someone !");
        return;
      }
    }

    /* ISSUE BOOK BECAUSE ALL CONDITION VALID */
    const promise = issueBook({
      bookID: bookData?.book?._id,
      userID: userData?.user?._id,
    });
    toast.promise(promise, {
      loading: "Issuing...",
      success: (data) => {
        setBookData(null);
        setUserData(null);
        return "Book Issued successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };
  return (
    <div className="issue__book">
      <h2>ISSUE BOOK</h2>
      <div className="details__container">
        <div className="student__details">
          {/* SEARCH SECTION */}
          <h3>Search User (Student / Teacher / HOD)</h3>
          <p>Find the user whom you want to issue books to.</p>
          <form onSubmit={searchStudent}>
            <div className="form-control autocomplete">
              <input
                type="text"
                placeholder="Search by email"
                name="email"
                onChange={(e) => handleStudentInputChange(e, "email")}
                onFocus={(e) => {
                  if (e.target.value) {
                    handleStudentInputChange(e, "email");
                  }
                }}
              />
              {activeStudentField === "email" &&
                studentSuggestions.length > 0 && (
                  <ul className="autocomplete__list autocomplete__list--users">
                    {studentSuggestions.map((student) => (
                      <li
                        key={student?._id}
                        onMouseDown={() =>
                          handleSelectStudentSuggestion(student, "email")
                        }
                      >
                        <div className="user__suggestion">
                          <img
                            src={
                              student?.imagePath
                                ? `${BASE_URL}/${student?.imagePath}`
                                : defaultCover
                            }
                            alt={student?.name}
                          />
                          <div className="content">
                            <span className="title">{student?.name}</span>
                            <span className="meta">
                              {student?.email}
                              {student?.rollNumber &&
                                `  ${student?.rollNumber}`}
                            </span>
                            <span className="meta">Role: {student?.role}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            <div className="form-control autocomplete">
              <input
                type="text"
                placeholder="Search by roll number"
                name="rollNumber"
                onChange={(e) => handleStudentInputChange(e, "rollNumber")}
                onFocus={(e) => {
                  if (e.target.value) {
                    handleStudentInputChange(e, "rollNumber");
                  }
                }}
              />
              {activeStudentField === "rollNumber" &&
                studentSuggestions.length > 0 && (
                  <ul className="autocomplete__list autocomplete__list--users">
                    {studentSuggestions.map((student) => (
                      <li
                        key={student?._id}
                        onMouseDown={() =>
                          handleSelectStudentSuggestion(student, "rollNumber")
                        }
                      >
                        <div className="user__suggestion">
                          <img
                            src={
                              student?.imagePath
                                ? `${BASE_URL}/${student?.imagePath}`
                                : defaultCover
                            }
                            alt={student?.name}
                          />
                          <div className="content">
                            <span className="title">{student?.name}</span>
                            <span className="meta">
                              {student?.rollNumber}
                              {student?.email && `  ${student?.email}`}
                            </span>
                            <span className="meta">Role: {student?.role}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            <button className="btn btn__secondary" type="submit">
              SEARCH
            </button>
          </form>

          {/* TABLE SECTION */}
          <div className="table__wrapper">
            <table>
              <tr>
                <th>Name</th>
                <td>{userData?.user?.name}</td>
              </tr>
              <tr>
                <th>Roll Number</th>
                <td>{userData?.user?.rollNumber}</td>
              </tr>

              <tr>
                <th>Email</th>
                <td>{userData?.user?.email}</td>
              </tr>

              <tr>
                <th>Role</th>
                <td>{userData?.user?.role}</td>
              </tr>

              <tr>
                <th>Account Status</th>
                <td>{userData?.user?.accountStatus}</td>
              </tr>

              <tr>
                <th>Borrowed Books</th>
                <td>{userData?.numberOfBorrowedBooks}</td>
              </tr>

              <tr>
                <th>Maximum Book Allowed</th>
                <td>{userData?.maxBooksAllowed}</td>
              </tr>

              <tr>
                <th>Exceed Limit</th>
                <td>
                  {userData?.hasExceededLimit ? (
                    <span className="badge badge__danger">Yes</span>
                  ) : (
                    <span className="badge badge__success">No</span>
                  )}
                </td>
              </tr>
            </table>
          </div>
        </div>
        <div className="book__details">
          <h3>Search Book</h3>
          <p>Find the book you want to issue</p>
          <form onSubmit={searchBook}>
            <div className="form-control autocomplete">
              <input
                type="text"
                placeholder="Search by ISBN or title"
                required
                name="ISBN"
                onChange={handleBookInputChange}
              />
              {bookSuggestions.length > 0 && (
                <ul className="autocomplete__list autocomplete__list--books">
                  {bookSuggestions.map((book) => (
                    <li
                      key={book?._id}
                      onMouseDown={() => handleSelectBookSuggestion(book)}
                    >
                      <div className="book__suggestion">
                        <img
                          src={
                            book?.imagePath
                              ? `${BASE_URL}/${book?.imagePath}`
                              : defaultCover
                          }
                          alt={book?.title}
                        />
                        <div className="content">
                          <span className="title">{book?.title}</span>
                          <span className="meta">ISBN: {book?.ISBN}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn btn__secondary" type="submit">
              SEARCH
            </button>
          </form>

          {/* TABLE SECTION */}
          <div className="table__wrapper">
            <table>
              <tr>
                <th>ISBN</th>
                <td>{bookData?.book?.ISBN}</td>
              </tr>

              <tr>
                <th>Title</th>
                <td>{bookData?.book?.title}</td>
              </tr>
              <tr>
                <th>Author</th>
                <td>{bookData?.book?.author}</td>
              </tr>

              <tr>
                <th>Quantity Left</th>
                <td>
                  {bookData?.book?.quantity === 0 ? (
                    <span className="badge badge__danger">Unavailable</span>
                  ) : bookData?.book?.quantity === 1 ? (
                    <span className="badge badge__warning">1 (Low)</span>
                  ) : (
                    bookData?.book?.quantity
                  )}
                </td>
              </tr>

              <tr>
                <th>Status</th>
                <td>
                  <span
                    className={`badge ${
                      bookData?.book?.status === "Available"
                        ? "badge__success"
                        : bookData?.book?.status === "Issued"
                        ? "badge__danger"
                        : bookData?.book?.status === "Reserved"
                        ? "badge__warning"
                        : "badge__info"
                    }`}
                  >
                    {bookData?.book?.status}
                  </span>
                </td>
              </tr>

              {bookData?.reservedAlready && (
                <>
                  <tr>
                    <th>Reserved By</th>
                    <td>{bookData?.reservedAlready?.user?.email}</td>
                  </tr>

                  <tr>
                    <th>Reserved Date</th>
                    <td>{formatDate(bookData?.reservedAlready?.date)}</td>
                  </tr>
                </>
              )}
            </table>
          </div>

          {/* ISSUE BUTTON */}
          <button className="btn btn__primary" onClick={handleIssueBook}>
            ISSUED BOOK
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueBook;
