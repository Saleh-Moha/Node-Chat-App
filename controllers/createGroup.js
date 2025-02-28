const group = require('../models/Group')


exports.creategroup = async(req,res)=>{
    try{
        const {name} = req.body;
        const creategroup = await group.create({
            name:name,
            admin : req.user._id,
        })
        res.json(creategroup)

    }catch(err){
        res.status(500).json(err);
    }
};


exports.getgroups = async(req,res) =>{
    try{
        const userId = req.user._id
        console.log("User ID:", userId);

        const groups = await group.find({
            $or: [{ admin: userId }, { members: { $in: [userId] } }]
        });

        if(!groups){
            return res.satatus(404).json({message : "no groups for this user"})
        }
        return res.status(200).json({group:groups})

    }
    catch(err){
        res.status(500).json(err);
    }
}


const mongoose = require("mongoose");

exports.getgroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const groupId = req.params.id;

    if (!groupId) {
      return res.status(400).json({ message: "No group ID provided" });
    }


    const checkGroup = await group.findById(groupId);
    if (!checkGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = checkGroup.admin.toString() === userId.toString();
    const isMember = checkGroup.members.some(
      (member) => member.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      return res.status(403).json({ message: "User is not in this group" });
    }

    return res.status(200).json({ group: checkGroup });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
