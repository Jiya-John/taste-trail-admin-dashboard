import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

export async function getUsers(db) {
  return await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
}

export async function getSingleUser(db, id) {
  return await db.collection("users").findOne({ _id: new ObjectId(id) });
}

export async function addUser(db, data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userDoc = {
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    email: data.email,
    streetName: data.streetName,
    city: data.city,
    province: data.province,
    country: data.country,
    postalCode: data.postalCode,
    passwordHash: hashedPassword,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection("users").insertOne(userDoc);
}

export async function editUser(db, id, data) {
  const update = {
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    streetName: data.streetName,
    city: data.city,
    province: data.province,
    country: data.country,
    postalCode: data.postalCode,
    updatedAt: new Date()
  };

  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: update });
}

export async function deleteUser(db, id) {
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(id) },
        {
        $set: {status: "inactive", updatedAt: new Date(),},
    });
}

export async function validateUser(db, data, isEdit = false, userId = null) {
    const { firstName, lastName, username, email, streetName, city, province, country, postalCode, password} = data;

    // Mandatory fields validation
    if (!firstName || 
        !lastName || 
        !username || 
        !email || 
        !streetName || 
        !city || 
        !province || 
        !country || 
        !postalCode || 
        (!isEdit && !password)) // password is required only for add user
        {
            return "All fields are required.";
        }


    // Check if username already exist
    const usernameQuery = { username };
    if (isEdit) {
        usernameQuery._id = { $ne: new ObjectId(userId) }; // except current user
    }
    const existingUsername = await db.collection("users").findOne(usernameQuery);
    if (existingUsername) {
        return "This username is already taken.";
    }

    // Check if valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address.";
    }

    // Check if email already existing
    const emailQuery = { email };
    if (isEdit) {
        emailQuery._id = { $ne: new ObjectId(userId) }; // except current user
    }
    const existingEmail = await db.collection("users").findOne(emailQuery);
    if (existingEmail) {
        return "This email is already registered.";
    }

    return null; // no errors
}