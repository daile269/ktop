import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  pageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  t1Values: {
    type: [String],
    default: []
  },
  t2Values: {
    type: [String],
    default: []
  },
  dateValues: {
    type: [String],
    default: []
  },
  deletedRows: {
    type: [Boolean],
    default: []
  },
  purpleRangeFrom: {
    type: Number,
    default: 0
  },
  purpleRangeTo: {
    type: Number,
    default: 0
  },
  keepLastNRows: {
    type: Number,
    default: 366
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Page = mongoose.model('Page', pageSchema);

export default Page;
