import User from '../models/user.js';

const UserService = {
  getUserById: async (id) => {
    return await User.findById(id);
  },

  updateUser: async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  },

  deleteUser: async (id) => {
    return await User.findByIdAndDelete(id);
  },

  createUser: async (userData) => {
    const user = new User(userData);
    return await user.save();
  },
};

export default UserService;
