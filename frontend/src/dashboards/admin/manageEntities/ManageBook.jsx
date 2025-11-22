import React, { useEffect, useState } from "react";
import {
  deleteBook,
  exportBooks,
  getAllBooks,
} from "../../../http";

import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { Modal, Pagination } from "../../../components";
import { Link, useNavigate } from "react-router-dom";

const ManageBook = () => {
  const [query, setQuery] = useState({ ISBN: "", title: "", status: "",category:"",almirah:"" });
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({});
  const [isFirstRender, setIsFirstRender] = useState(true);
  const navigate = useNavigate();
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
 

  const handleDelete = (_id) => {
    const promise = deleteBook(_id);
    toast.promise(promise, {
      loading: "deleting...",
      success: (data) => {
        fetchData();
        return "Book Deleted successfully..";
      },
      error: (err) => {
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  const handleCloseDeleteModel = () => {
    setShowDeleteModel(false);
    setSelectedBook(null);
  };

  const openDeleteModal = (book) => {
    setSelectedBook(book);
    setShowDeleteModel(true);
  };

  const handleExport = () => {
    const promise = exportBooks();
    toast.promise(promise, {
      loading: "Exporting...",
      success: (response) => {
        window.open(response?.data?.downloadUrl);
        return "Books Exported successfully";
      },
      error: (err) => {
        console.log(err);
        return "Something went wrong while exporting data.";
      },
    });
  };

  const fetchData = async () => {
    try {
      const { data } = await getAllBooks(
        query,currentPage
      );
      console.log(data);
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
        <h2>Manage Books</h2>
        <div>
          <Link to="/admin/dashboard/add-new-book"
            className="btn btn__secondary"
          >
            Add New
          </Link>
          <button className="btn btn__secondary" onClick={handleExport}>
            Export to CSV
          </button>
        </div>
      </div>

      <div className="filter">
        <input
          type="text"
          placeholder="Search by ISBN...."
          className="background__accent text"
          value={query.ISBN}
          onChange={(e) => {
            setQuery({ ...query, ISBN: e.target.value });
          }}
        />
        <input
          type="text"
          placeholder="Search by title...."
          className="background__accent text"
          value={query.title}
          onChange={(e) => {
            setQuery({ ...query, title: e.target.value });
          }}
        />
        <select value={query.status} onChange={(e)=>{setQuery({...query,status:e.target.value});setCurrentPage(1)}} className="bg__accent text__color">
            <option value="">Filter by Status</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="Reserved">Reserved</option>
            <option value="Lost">Lost</option>
        </select>
        <button
          className="btn btn__primary"
          onClick={() => {
            setQuery({ title: "", ISBN: "", status: "" });
          }}
        >
          CLEAR
        </button>
      </div>

      <div className="table__wrapper" style={{ overflow: "auto" }}>
        <table className="background__accent" cellSpacing="0" cellPadding="0">
          <thead className="bg__secondary">
            <tr>
              <td>ISBN</td>
              <td>Title</td>
              <td>Author</td>
              <td>Quantity</td>
              <td>Status</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            {data?.books?.map((i) => {
              const quantity =
                typeof i?.quantity === "number" ? i.quantity : 0;
              const isOffTheShelf = quantity === 0;
              const effectiveStatus = isOffTheShelf ? "Unavailable" : i.status;
              return (
                <tr key={i._id}>
                  <td>{i.ISBN}</td>
                  <td>{i.title}</td>
                  <td>{i.author}</td>
                  <td>
                    {quantity === 0 ? (
                      <span className="badge badge__danger">Off the shelf</span>
                    ) : quantity === 1 ? (
                      <span className="badge badge__warning">Low stock (1 copy left)</span>
                    ) : (
                      quantity
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        effectiveStatus === "Available"
                          ? "badge__success"
                          : effectiveStatus === "Issued"
                          ? "badge__danger"
                          : effectiveStatus === "Reserved"
                          ? "badge__warning"
                          : "badge__danger"
                      }`}
                    >
                      {effectiveStatus}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => {
                          navigate(`/admin/dashboard/book-details/${i._id}`);
                        }}
                        className="btn btn__success"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn btn__warning"
                        onClick={() => {
                          navigate(`/admin/dashboard/update-book/${i._id}`);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn__danger"
                        onClick={() => {
                          openDeleteModal(i);
                        }}
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

      {/* DELETE CONFIRMATION MODAL */}
      <div>
        <Modal
          title="DELETE BOOK"
          show={showDeleteModel}
          onClose={handleCloseDeleteModel}
        >
          <div className="form-control">
            <p>
              Are you sure you want to delete
              {" "}
              <span className="text__danger">
                {selectedBook?.title || "this book"}
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
                if (selectedBook?._id) {
                  handleDelete(selectedBook._id);
                }
                handleCloseDeleteModel();
              }}
            >
              YES, DELETE
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ManageBook;
