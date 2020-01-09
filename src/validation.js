import Joi from '@hapi/joi';

const formateJoiError = (joError) => {
  const { details } = joError;
  const error = {};
  details.forEach((detail) => {
    if (error[detail.context.label]) {
      error[detail.context.label].push(detail.message);
    } else {
      error[detail.context.label] = [detail.message];
    }
  });
  return error;
};

const validate = (validationSchema, data) => {
  const validationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
    skipFunctions: true,
  };
  const result = validationSchema.validate(data, validationOptions);
  if (result.error) {
    const formattedError = formateJoiError(result.error);
    result.error = formattedError;
    return result;
  }
  return result.value;
};

export const startListening = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    deviceId: Joi.string().required(),
    meta: Joi.string(),
    interval: Joi.valid(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).default(1),
  });

  const requestData = validate(schema, req.body);
  if (requestData.error) return res.status(400).json({ success: false, message: 'Invalid request', error: requestData.error });
  req.body = requestData;

  return next();
};

export const stopListening = (req, res, next) => {
  const schema = Joi.object({
    deviceId: Joi.string().required(),
  });
  const requestData = validate(schema, req.body);
  if (requestData.error) return res.status(400).json({ success: false, message: 'Invalid request', error: requestData.error });
  req.body = requestData;

  return next();
};
