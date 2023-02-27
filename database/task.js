const database = include("databaseConnection");

createTask = async (userInfo) => {
  console.log(userInfo);

  const createTaskSql = `
    INSERT INTO todos 
    (user_id, description) 
    VALUES 
    (:user_id, :description);
    `;
  const params = {
    user_id: userInfo.user_id,
    description: userInfo.description,
  };
  try {
    const result = await database.query(createTaskSql, params);
    console.log(result[0]);
    console.log("Task created successfully");
    return true;
  } catch (error) {
    console.log(error);
    console.log("Task creation failed");
    return false;
  }
};

getTasks = async (user_id) => {
  const getTasksSQL = `
        SELECT description 
        FROM todos 
        WHERE user_id = :user_id;
    `;
  const params = {
    user_id: user_id,
  };
  try {
    const result = await database.query(getTasksSQL, params);
    console.log(result[0]);
    console.log("Tasks retrieved successfully");
    return result[0];
  } catch (error) {
    console.log(error);
    console.log("Tasks retrieval failed");
    return false;
  }
};

module.exports = { createTask, getTasks };
