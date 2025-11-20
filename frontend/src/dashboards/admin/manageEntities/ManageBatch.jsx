import React, { useEffect, useState } from "react";
import {
  addNewBatch,
  exportBatches,
  getAllBatches,
  updateBatch,
  deleteBatches,
} from "../../../http";
import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { Modal, Pagination } from "../../../components";

const ManageBatch = () => {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({});
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [showAddNewModel, setShowAddNewModel] = useState(false);
  const [showUpdateModel, setShowUpdateModel] = useState(false);

  const initialState = {
    _id: "",
    name: "",
    startingYear: "",
    endingYear : "",
  };
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({ name: "", startingYear: "", endingYear: "" });

  // allow letters, numbers, spaces and '-', with explicit checks for first/last character
  const batchNameAllowedCharsRegex = /^[A-Za-z0-9-\s]+$/;

  const validateField = (name, value, nextState = null) => {
    const state = nextState || { ...formData, [name]: value };
    let msg = "";
    if (name === "name") {
      const trimmed = value.trim();
      if (!trimmed) {
        msg = "Batch name is required";
      } else if (!batchNameAllowedCharsRegex.test(trimmed)) {
        msg = "Batch name can have letters, numbers and '-', '-' cannot be at beginning or end";
      } else if (!/^[A-Za-z]/.test(trimmed)) {
        // first character must be a letter (no number or '-')
        msg = "Batch name cannot start with a number or '-'";
      } else if (trimmed.endsWith("-")) {
        msg = "'-' cannot be at the end of batch name";
      }
    }
    if (name === "startingYear") {
      if (!value) msg = "Starting year is required";
      else {
        const year = parseInt(value, 10);
        if (isNaN(year)) msg = "Starting year must be a number";
        else if (year < 2013 || year > 2099)
          msg = "Starting year must be between 2013 and 2099";
        else if (state.endingYear) {
          const end = parseInt(state.endingYear, 10);
          if (!isNaN(end)) {
            if (year >= end)
              msg = "Starting year should be smaller than ending year";
            else if (end - year !== 4)
              msg = "There should be exactly 4 years gap between starting and ending year";
          }
        }
      }
    }
    if (name === "endingYear") {
      if (!value) msg = "Ending year is required";
      else {
        const year = parseInt(value, 10);
        if (isNaN(year)) msg = "Ending year must be a number";
        else if (year < 2013 || year > 2099)
          msg = "Ending year must be between 2013 and 2099";
        else if (state.startingYear) {
          const start = parseInt(state.startingYear, 10);
          if (!isNaN(start)) {
            if (start >= year)
              msg = "Ending year must be greater than starting year";
            else if (year - start !== 4)
              msg = "There should be exactly 4 years gap between starting and ending year";
          }
        }
      }
    }
    setErrors((prev) => ({ ...prev, [name]: msg }));
    return msg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newState = { ...formData, [name]: value };
    setFormData(newState);
    validateField(name, value, newState);
    if (name === "startingYear" && newState.endingYear) {
      validateField("endingYear", newState.endingYear, newState);
    }
    if (name === "endingYear" && newState.startingYear) {
      validateField("startingYear", newState.startingYear, newState);
    }
  };

  const handleCloseAddNewModel = () => {
    setShowAddNewModel(false);
    setFormData(initialState);
    setErrors({ name: "", startingYear: "", endingYear: "" });
  };

  const handleCloseUpdateModel = () => {
    setShowUpdateModel(false);
    setFormData(initialState);
    setErrors({ name: "", startingYear: "", endingYear: "" });
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    const promise = addNewBatch({
      name: formData.name,
      startingYear: formData.startingYear,
      endingYear : formData.endingYear
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: (data) => {
        setFormData(initialState);
        fetchData();
        setShowAddNewModel(false);
        return "Added successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleDelete = (_id) => {
    const promise = deleteBatches(_id);
    toast.promise(promise, {
      loading: "Deleting...",
      success: () => {
        fetchData();
        return "Deleted successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const promise = updateBatch(formData?._id, {
        name: formData.name,
        startingYear: formData.startingYear,
        endingYear : formData.endingYear
    });
    toast.promise(promise, {
      loading: "Updating...",
      success: (data) => {
        setFormData(initialState);
        fetchData();
        setShowUpdateModel(false);
        return "Updated successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleExport = () => {
    const promise = exportBatches();
    toast.promise(promise, {
      loading: "Exporting",
      success: (response) => {
        window.open(response?.data?.downloadUrl);
        return "Exported successfully";
      },
      error: (err) => {
        console.log(err);
        return "Something went wrong while exporting data.";
      },
    });
  };

  const fetchData = async () => {
    try {
      const { data } = await getAllBatches(query, currentPage);
      setData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setCurrentPage(1);
    // debouncing
    const handler = setTimeout(() => {
      fetchData();
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  return (
    <div className="manage__section bg">
      <div className="header">
        <h2>Manage Batches</h2>
        <div>
          <button
            className="btn btn__secondary"
            onClick={() => {
              setShowAddNewModel(true);
            }}
          >
            Add New
          </button>
          <button className="btn btn__secondary" onClick={handleExport}>
            Export to CSV
          </button>
        </div>
      </div>

      <div className="filter">
        <input
          type="text"
          placeholder="Search batches...."
          className="background__accent text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
        <button
          className="btn btn__primary"
          onClick={() => {
            setQuery("");
          }}
        >
          CLEAR
        </button>
      </div>

      <div className="table__wrapper">
        <table className="background__accent" cellSpacing="0" cellPadding="0">
          <thead className="bg__secondary">
            <tr>
              <td>ID</td>
              <td>Name</td>
              <td>Starting Year</td>
              <td>Ending Year</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            {data?.batches?.map((i) => {
              return (
                <tr key={i._id}>
                  <td>{i._id}</td>
                  <td>{i.name}</td>
                  <td>{i.startingYear}</td>
                  <td>{i.endingYear}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn__warning"
                        onClick={() => {
                          setFormData({
                              _id : i._id,
                              name: i.name,
                              startingYear: i.startingYear,
                              endingYear : i.endingYear
                          });
                          setErrors({ name: "", startingYear: "", endingYear: "" });
                          setShowUpdateModel(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn__danger"
                        onClick={() => handleDelete(i._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        data={data}
      />

      {/* ADD NEW Batch FORM */}
      <Modal
        title="ADD NEW BATCH"
        show={showAddNewModel}
        onClose={handleCloseAddNewModel}
      >
        <form onSubmit={handleAddNew}>
          <div className="form-control">
            <label htmlFor="name">Batch Name</label>
            <input
              type="text"
              placeholder="Enter batch name"
              name="name"
              className="bg text__color"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <small className="text__danger">{errors.name}</small>}
          </div>
          <div className="form-control">
            <label htmlFor="startingYear">Batch Starting Year</label>
            <input
              type="number"
              placeholder="Enter starting year"
              name="startingYear"
              className="bg text__color"
              value={formData.startingYear}
              onChange={handleChange}
              required
            />
            {errors.startingYear && (
              <small className="text__danger">{errors.startingYear}</small>
            )}
          </div>

          <div className="form-control">
            <label htmlFor="endingYear">Batch Ending Year</label>
            <input
              type="number"
              placeholder="Enter ending year"
              name="endingYear"
              className="bg text__color"
              value={formData.endingYear}
              onChange={handleChange}
              required
            />
            {errors.endingYear && (
              <small className="text__danger">{errors.endingYear}</small>
            )}
          </div>
          <div className="actions">
            <button
              className="btn btn__danger"
              type="button"
              onClick={handleCloseAddNewModel}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn__success"
              disabled={
                !formData.name.trim() ||
                !formData.startingYear ||
                !formData.endingYear ||
                !!errors.name ||
                !!errors.startingYear ||
                !!errors.endingYear
              }
            >
              SUBMIT
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE BATCH FORM */}
      <Modal
        title="UPDATE BATCH"
        show={showUpdateModel}
        onClose={handleCloseUpdateModel}
      >
        <form onSubmit={handleUpdate}>
          <div className="form-control">
            <label htmlFor="name">Batch Name</label>
            <input
              type="text"
              placeholder="Enter batch name"
              name="name"
              className="bg text__color"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <small className="text__danger">{errors.name}</small>}
          </div>
          <div className="form-control">
            <label htmlFor="startingYear">Batch Starting Year</label>
            <input
              type="number"
              placeholder="Enter starting year"
              name="startingYear"
              className="bg text__color"
              value={formData.startingYear}
              onChange={handleChange}
              required
            />
            {errors.startingYear && (
              <small className="text__danger">{errors.startingYear}</small>
            )}
          </div>

          <div className="form-control">
            <label htmlFor="endingYear">Batch Ending Year</label>
            <input
              type="number"
              placeholder="Enter ending year"
              name="endingYear"
              className="bg text__color"
              value={formData.endingYear}
              onChange={handleChange}
              required
            />
            {errors.endingYear && (
              <small className="text__danger">{errors.endingYear}</small>
            )}
          </div>
          <div className="actions">
            <button
              className="btn btn__danger"
              type="button"
              onClick={handleCloseUpdateModel}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn__success"
              disabled={
                !formData.name.trim() ||
                !formData.startingYear ||
                !formData.endingYear ||
                !!errors.name ||
                !!errors.startingYear ||
                !!errors.endingYear
              }
            >
              UPDATE
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageBatch;
