const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.log("Inside customer error handler ❌", err)
  if (err.code === 11000) {
    const duplicateError = Object.entries(err.keyValue);
    const duplicateField = duplicateError[0][0];
    const duplicateValue = duplicateError[0][1];

    return res.status(409).json({
      message:
        `${duplicateField} ${duplicateValue} already exists`,
      duplicateField,
    });
  }
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
