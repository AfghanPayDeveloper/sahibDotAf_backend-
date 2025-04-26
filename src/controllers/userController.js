import UserService from '../services/userService.js';
import fs from 'fs';

export const getAuthenticatedUser = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAuthenticatedUser = async (req, res) => {
  try {
    const { file } = req; 
    const userData = req.body;


    if (file) {
      userData.profileImage = `/uploads/profiles/${file.filename}`;


      const user = await UserService.getUserById(req.user.id);
      if (user.profileImage) {
        const oldProfileImagePath = `.${user.profileImage}`;
        if (fs.existsSync(oldProfileImagePath)) {
          fs.unlinkSync(oldProfileImagePath);
        }
      }
    }


    const updatedUser = await UserService.updateUser(req.user.id, userData);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAuthenticatedUser = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    if (user.profileImage) {
      const profileImagePath = `.${user.profileImage}`;
      if (fs.existsSync(profileImagePath)) {
        fs.unlinkSync(profileImagePath);
      }
    }

    await UserService.deleteUser(req.user.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const newUser = await UserService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
