import MainSlider from '../models/mainSlider.js';
import path from 'path';
import fs from 'fs';

export const createSlider = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const newSlider = new MainSlider({
      imageName: req.body.imageName,
      image: `/uploads/${req.file.filename}`,
    });

    await newSlider.save();
    res.status(201).json(newSlider);
  } catch (error) {
    console.error('Error creating slider:', error);
    res.status(500).json({ error: 'Failed to create slider' });
  }
};

export const getSliders = async (req, res) => {
  try {
    const sliders = await MainSlider.find().sort({ createdAt: -1 });
    res.json(sliders);
  } catch (error) {
    console.error('Error fetching sliders:', error);
    res.status(500).json({ error: 'Failed to fetch sliders' });
  }
};

export const updateSlider = async (req, res) => {
  try {
    const slider = await MainSlider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ error: 'Slider not found' });
    }

    if (req.file) {
      // Remove old image
      const oldImagePath = path.join(process.cwd(), slider.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      slider.image = `/uploads/${req.file.filename}`;
    }

    if (req.body.imageName) {
      slider.imageName = req.body.imageName;
    }

    if (req.body.isActive !== undefined) {
      slider.isActive = req.body.isActive;
    }

    await slider.save();
    res.json(slider);
  } catch (error) {
    console.error('Error updating slider:', error);
    res.status(500).json({ error: 'Failed to update slider' });
  }
};

export const deleteSlider = async (req, res) => {
  try {
    const slider = await MainSlider.findByIdAndDelete(req.params.id);
    if (!slider) {
      return res.status(404).json({ error: 'Slider not found' });
    }

    // Delete image file
    const imagePath = path.join(process.cwd(), slider.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Slider deleted successfully' });
  } catch (error) {
    console.error('Error deleting slider:', error);
    res.status(500).json({ error: 'Failed to delete slider' });
  }
};

export const toggleSliderStatus = async (req, res) => {
  try {
    const slider = await MainSlider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ error: 'Slider not found' });
    }

    slider.isActive = !slider.isActive;
    await slider.save();
    res.json(slider);
  } catch (error) {
    console.error('Error toggling slider status:', error);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
};