const Group = require('../models/Group');



exports.creategroup = async(req,res)=>{
    try{
        const {name} = req.body;
        const creategroup = await Group.create({
            name:name,
            admins : req.user._id,
        })
        res.json(creategroup)

    }catch(err){
        res.status(500).json(err);
    }
};


exports.getgroups = async(req,res) =>{
    try{
        const userId = req.user._id

        const groups = await Group.find({
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



exports.getgroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const groupId = req.params.id;

    if (!groupId) {
      return res.status(400).json({ message: "No group ID provided" });
    }


    const checkGroup = await Group.findById(groupId);
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


exports.updategroup = async (req, res) => {
  try {  
    const groupId = req.params.id;
    const userId = req.user._id;

    if (!groupId) {
      return res.status(400).json({ message: "No group ID provided" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.admins.includes(userId);
    const isMember = group.members.includes(userId);
    const isPublic = group.group_status === "Public";

    if (group.group_status === "Private" && !isAdmin) {
      return res.status(403).json({ message: "Only admins can update this private group." });
    }

    if (group.group_status === "Public" && !isAdmin && !isMember) {
      return res.status(403).json({ message: "Only admins and members can update this public group." });
    }

    const allowedFields = ["name", "admins", "members", "message_status"];
    const updateData = {};

    for (const key in req.body) {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      } else {
        return res.status(400).json({ message: `Invalid field: ${key}` });
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ message: "Group updated successfully", group: updatedGroup });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





exports.deletegroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;
    if (!groupId) {
      return res.status(400).json({ message: "No group ID provided" });
    }
    const findGroup = await Group.findById(groupId)
    if(!findGroup){
      return res.status(404).json({message:"Group not found"})
    }
    const check_user = findGroup.admin.includes(userId)
    if(!check_user){
      return res.status(403).json({message:"Only admins can delete the group"})
    }
    await Group.findByIdAndDelete(groupId)
    return res.status(200).json({message:"group deleted"})

  } catch (err) {
    res.status(500).json(err);
  }
}