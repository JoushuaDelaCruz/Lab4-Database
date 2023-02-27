const database = include("databaseConnection");

createUser = async (user) => {
  const createUserSql = `
    INSERT INTO user 
    (username, password, email) 
    VALUES 
    (:username, :password, :email);
    `;
  const params = {
    username: user.name,
    password: user.password,
    email: user.email,
  };

  try {
    const result = await database.query(createUserSql, params);
    console.log("User created successfully");
    console.log(result[0]);
    return true;
  } catch (error) {
    console.log("User not created");
    console.log(error);
    return false;
  }
};

getUser = async (username) => {
  const getUserSql = `
    SELECT user_id, username, password, email, user_type
    FROM user
    JOIN user_type USING (user_type_id)
    WHERE username = :username;
    `;
  const params = {
    username: username,
  };
  try {
    const result = await database.query(getUserSql, params);
    console.log(result[0]);
    console.log("User retrieved successfully");
    return result[0][0];
  } catch (error) {
    console.log("User not retrieved");
    return false;
  }
};

getUserById = async (user_id) => {
  const getUserSql = `
    SELECT username
    FROM user
    JOIN user_type USING (user_type_id)
    WHERE user_id = :user_id;
    `;
  const params = {
    user_id: user_id,
  };
  try {
    const result = await database.query(getUserSql, params);
    console.log(result[0]);
    console.log("User retrieved successfully");
    return result[0][0];
  } catch (error) {
    console.log("User not retrieved");
    return false;
  }
};

getAllUsers = async (userId) => {
  const getUserSql = `
    SELECT user_id, username
    FROM user
    WHERE user_id <> :userId AND user_type_id = 2;
    `;
  const params = {
    userId: userId,
  };
  try {
    const result = await database.query(getUserSql, params);
    console.log(result[0]);
    console.log("All users retrieved successfully");
    return result[0];
  } catch (error) {
    console.log("Users not retrieved");
    return false;
  }
};

module.exports = { createUser, getUser, getAllUsers, getUserById };
