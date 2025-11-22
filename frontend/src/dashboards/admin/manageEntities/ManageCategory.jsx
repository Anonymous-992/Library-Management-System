import React, { useEffect, useState } from "react";
import {
  addNewCategory,
  exportCategories,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../../../http";
import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { Modal, Pagination } from "../../../components";

const ManageCategory = () => {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({});
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [showAddNewModel, setShowAddNewModel] = useState(false);
  const [showUpdateModel, setShowUpdateModel] = useState(false);
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const initialState = {
    _id: "",
    name: "",
    description: null,
  };
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCloseAddNewModel = () => {
    setShowAddNewModel(false);
    setFormData(initialState);
  };

  const handleCloseUpdateModel = () => {
    setShowUpdateModel(false);
    setFormData(initialState);
  };

  const handleCloseDeleteModel = () => {
    setShowDeleteModel(false);
    setSelectedCategory(null);
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    const promise = addNewCategory({
      name: formData.name,
      description: formData.description,
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: (data) => {
        setFormData(initialState);
        fetchCategoires();
        setShowAddNewModel(false);
        return "Category added successfully..";
      },
      error: (err) => {
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const promise = updateCategory(formData?._id, {
      name: formData.name,
      description: formData.description,
    });
    toast.promise(promise, {
      loading: "Updating...",
      success: (data) => {
        setFormData(initialState);
        fetchCategoires();
        setShowUpdateModel(false);
        return "Category updated successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleExport = () => {
    const promise = exportCategories();
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

  const fetchCategoires = async () => {
    try {
      const { data } = await getAllCategories(query, currentPage);
      setData(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = (_id) => {
    const promise = deleteCategory(_id);
    toast.promise(promise, {
      loading: "deleting...",
      success: (data) => {
        fetchCategoires();
        return "Category deleted successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setShowDeleteModel(true);
  };

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setCurrentPage(1);
    // debouncing
    const handler = setTimeout(() => {
      fetchCategoires();
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    fetchCategoires();
  }, [currentPage]);

  return (
    <div className="manage__section bg">
      <div className="header">
        <h2>Manage Categories</h2>
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
          placeholder="Search category...."
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
              <td>Description</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            {data?.categories?.map((category, index) => {
              return (
                <tr key={category._id}>
                  <td>{category._id}</td>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>
                    {/* <button className="btn btn__success">
                      <FaEye />
                    </button> */}
                    <button
                      className="btn btn__warning"
                      onClick={() => {
                        setFormData({
                          name: category.name,
                          description: category.description,
                          _id: category._id,
                        });
                        setShowUpdateModel(true);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn__danger"
                      onClick={() => {
                        openDeleteModal(category);
                      }}
                    >
                      <FaTrash />
                    </button>
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        title="DELETE CATEGORY"
        show={showDeleteModel}
        onClose={handleCloseDeleteModel}
      >
        <div className="form-control">
          <p>
            Are you sure you want to delete
            {" "}
            <span className="text__danger">
              {selectedCategory?.name || "this category"}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="actions">
          <button
            className="btn btn__secondary"
            type="button"
            onClick={handleCloseDeleteModel}
          >
            NO, CANCEL
          </button>
          <button
            className="btn btn__danger"
            type="button"
            onClick={() => {
              if (selectedCategory?._id) {
                handleDelete(selectedCategory._id);
              }
              handleCloseDeleteModel();
            }}
          >
            YES, DELETE
          </button>
        </div>
      </Modal>

      {/* ADD NEW CATEGORY FORM */}
      <Modal
        title="ADD NEW CATEGORY"
        show={showAddNewModel}
        onClose={handleCloseAddNewModel}
      >
        <form onSubmit={handleAddNew}>
          <div className="form-control">
            <label htmlFor="name">Category Name</label>
            <input
              type="text"
              placeholder="Enter category name"
              name="name"
              className="bg text__color"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-control">
            <label htmlFor="description">Category Description(Optional)</label>
            <textarea
              name="description"
              id=""
              cols="30"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="bg text__color"
            ></textarea>
          </div>
          <div className="actions">
            <button
              className="btn btn__danger"
              type="button"
              onClick={handleCloseAddNewModel}
            >
              CANCEL
            </button>
            <button type="submit" className="btn btn__success">
              SUBMIT
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE CATEGORY FORM */}
      <Modal
        title="UPDATE CATEGORY"
        show={showUpdateModel}
        onClose={handleCloseUpdateModel}
      >
        <form onSubmit={handleUpdate}>
          <div className="form-control">
            <label htmlFor="name">Category Name</label>
            <input
              type="text"
              placeholder="Enter category name"
              name="name"
              className="bg text__color"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-control">
            <label htmlFor="description">Category Description(Optional)</label>
            <textarea
              name="description"
              id=""
              cols="30"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="bg text__color"
            ></textarea>
          </div>
          <div className="actions">
            <button
              className="btn btn__danger"
              type="button"
              onClick={handleCloseUpdateModel}
            >
              CANCEL
            </button>
            <button type="submit" className="btn btn__success">
              UPDATE
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageCategory;
