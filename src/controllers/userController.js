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
    const { file } = req; // Get the file if uploaded
    const userData = req.body;

    // Check if a new profile image is uploaded
    if (file) {
      userData.profileImage = `/uploads/profileImages/${file.filename}`;

      // If there's an existing profile image, delete the old one from the server
      const user = await UserService.getUserById(req.user.id);
      if (user.profileImage) {
        const oldProfileImagePath = `.${user.profileImage}`;
        if (fs.existsSync(oldProfileImagePath)) {
          fs.unlinkSync(oldProfileImagePath);
        }
      }
    }

    // Update the user with new data
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

    // Delete the user's profile image if it exists
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
