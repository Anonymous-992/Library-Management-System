import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  addNewBook,
  getAllAlmirahsWithoutPagination,
  getAllCategoriesWithoutPagination,
} from "../../../http";
import { useNavigate } from "react-router-dom";

const AddNewBook = () => {
  const [categories, setCategories] = useState();
  const [almirahs, setAlmirahs] = useState();
  const navigate = useNavigate();
  const initailState = {
    ISBN: "",
    title: "",
    category: "",
    author: "",
    almirah: "",
    publisher: "",
    shelf: "",
    image: "",
    edition: "",
    quantity: "",
    description: "",
  };
  const [formData, setFormData] = useState(initailState);
  const [errors, setErrors] = useState({ ISBN: "", quantity: "" });

  const validateIsbn = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "ISBN is required";
    if (!/^[0-9-]+$/.test(trimmed)) {
      return "ISBN must contain only digits and hyphens";
    }
    if (trimmed.startsWith("-") || trimmed.endsWith("-")) {
      return "Hyphen cannot be at the beginning or end";
    }
    const digitsOnly = trimmed.replace(/-/g, "");
    if (!/^\d+$/.test(digitsOnly) || digitsOnly.length < 10 || digitsOnly.length > 13) {
      return "ISBN must contain 10 to 13 digits";
    }
    return "";
  };

  //   handle change into input fields
  const hanldeInputChange = (e) => {
    const { name, files } = e.target;
    if (name === "image") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      const value = e.target.value;
      setFormData({ ...formData, [name]: value });

      // basic inline validation for numeric quantity and ISBN format
      if (name === "quantity") {
        let msg = "";
        const num = Number(value);
        if (!value) {
          msg = "Quantity is required";
        } else if (!Number.isInteger(num) || num <= 0) {
          msg = "Quantity must be a whole number greater than 0";
        }
        setErrors((prev) => ({ ...prev, quantity: msg }));
      }

      if (name === "ISBN") {
        const msg = validateIsbn(value);
        setErrors((prev) => ({ ...prev, ISBN: msg }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // final validation before submit
    const quantityNum = Number(formData.quantity);
    let isbnMsg = validateIsbn(formData.ISBN);
    let qtyMsg = errors.quantity;

    if (!formData.quantity) {
      qtyMsg = "Quantity is required";
    } else if (!Number.isInteger(quantityNum) || quantityNum <= 0) {
      qtyMsg = "Quantity must be a whole number greater than 0";
    }

    if (isbnMsg || qtyMsg) {
      setErrors({ ISBN: isbnMsg, quantity: qtyMsg });
      return;
    }
    const dataToPost = new FormData();
    for (const key in formData) {
      if (formData[key] !== "") {
        dataToPost.append(key, formData[key]);
      }
    }

    const promise = addNewBook(dataToPost);

    toast.promise(promise, {
      loading: "Creating...",
      success: (data) => {
        setFormData(initailState);
        setErrors({ ISBN: "", quantity: "" });
        return "Book created successfully..";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: categoriesData } =
          await getAllCategoriesWithoutPagination();
        setCategories(categoriesData?.categories);
        const { data: almirahsData } = await getAllAlmirahsWithoutPagination();
        setAlmirahs(almirahsData?.almirahs);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);
  return (
    <div className="form">
      <h3 style={{ padding: "20px" }}>ADD NEW BOOK</h3>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="input__container__3">
            <div className="form-control">
              <label htmlFor="ISBN">ISBN</label>
              <input
                type="text"
                placeholder="Enter ISBN"
                id="ISBN"
                required
                name="ISBN"
                value={formData.ISBN}
                onChange={hanldeInputChange}
              />
              {errors.ISBN && (
                <small className="text__danger">{errors.ISBN}</small>
              )}
            </div>
            <div className="form-control">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                placeholder="Enter title"
                id="title"
                required
                name="title"
                value={formData.title}
                onChange={hanldeInputChange}
              />
            </div>
            {/* Category */}
            <div className="form-control">
              <label htmlFor="category">Category</label>
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={hanldeInputChange}
                className="bg__accent text__color"
                required
              >
                <option value="">Select Category</option>
                {categories?.map((i) => {
                  return (
                    <option key={i._id} value={i._id}>
                      {i.name}
                    </option>
                  );
                })}
              </select>
            </div>
            {/* Almirah */}
            <div className="form-control">
              <label htmlFor="almirah">Almirah</label>
              <select
                name="almirah"
                id="almirah"
                value={formData.almirah}
                onChange={hanldeInputChange}
                className="bg__accent text__color"
                required
              >
                <option value="">Select Almirah</option>
                {almirahs?.map((i) => {
                  return (
                    <option key={i._id} value={i._id}>
                      {i.subject} ({i.number})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-control">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                placeholder="Enter author"
                id="author"
                required
                name="author"
                value={formData.author}
                onChange={hanldeInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="publisher">Publisher(Optional)</label>
              <input
                type="text"
                placeholder="Enter Publisher"
                id="publisher"
                name="publisher"
                value={formData.publisher}
                onChange={hanldeInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="image">Image(Optional)</label>
              <input
                type="file"
                accept="image/*"
                placeholder="Select Image"
                id="image"
                name="image"
                onChange={hanldeInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="shelf">Shelf(Optional)</label>
              <select
                name="shelf"
                id="shelf"
                value={formData.shelf}
                onChange={hanldeInputChange}
                className="bg__accent text__color"
              >
                <option value="">Select Shelf</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            <div className="form-control">
              <label htmlFor="edition">edition(Optional)</label>
              <input
                type="text"
                placeholder="Enter Edition"
                id="edition"
                name="edition"
                value={formData.edition}
                onChange={hanldeInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="quantity">No. Of Copies</label>
              <input
                type="number"
                min="1"
                placeholder="Enter Quantity"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={hanldeInputChange}
                required
              />
              {errors.quantity && (
                <small className="text__danger">{errors.quantity}</small>
              )}
            </div>
            {/* tags */}
          </div>
          <br />
          <div className="form-control">
            <label htmlFor="desc">Description(Optional)</label>
            <textarea
              name="description"
              id="desc"
              cols="30"
              rows="2"
              placeholder="Enter Description"
              value={formData.description}
              onChange={hanldeInputChange}
              className="bg__accent text__color"
            ></textarea>
          </div>
          <div className="actions">
            <button
              className="btn btn__danger"
              type="button"
              onClick={() => {
                navigate(-1);
              }}
            >
              Go Back
            </button>
            <button className="btn btn__primary" type="submit">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewBook;
