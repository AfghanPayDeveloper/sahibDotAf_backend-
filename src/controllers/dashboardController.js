import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Workspace from "../models/Workspace.js";

// Controller to get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const myWorkspaces = await Workspace.find({ userId });

    const workspaceIds = myWorkspaces.map((workspace) => workspace._id);

    const productViews = await Product.aggregate([
      { $match: { workspaceId: { $in: workspaceIds } } },
      { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
    ]);

    const serviceViews = await Service.aggregate([
      { $match: { workspaceId: { $in: workspaceIds } } },
      { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
    ]);

    const userProductsCount = await Product.countDocuments({
      workspaceId: { $in: workspaceIds },
    });

    // Mock data
    const totalUsers =5;
    const totalProfit = 5690.01;
    
    let totalViews; 
    console.log(productViews, serviceViews)

    if(productViews[0]) totalViews = productViews[0]?.totalViews
    if(serviceViews[0]) totalViews += serviceViews[0]?.totalViews 

    res.status(200).json({
      totalViews,
      userProducts: userProductsCount,
      totalUsers,
      totalProfit,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
