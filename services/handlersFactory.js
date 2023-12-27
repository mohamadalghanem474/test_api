const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await Model.destroy({ where: { id } });

    if (result === 0) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(204).send();
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const [rowsCount, updatedDocument] = await Model.update(req.body, {
      where: { id },
      returning: true,
    });

    if (rowsCount === 0) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(200).json({ data: updatedDocument[0] });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({ data: newDoc });
  });

exports.getOne = (Model, includeOpt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Build query
    let options = {};
    if (includeOpt) {
      options.include = includeOpt;
    }

    const document = await Model.findByPk(id, options);

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(200).json({ data: document });
  });

exports.getAll = (Model) =>
  asyncHandler(async (req, res) => {
    const documents =await Model.findAll();
    res.status(200).json({ results: documents.length, data: documents });
  });
