const Group = require("../../models/Group");

const Addadmins = async (req, res) => {
    try {
        const userId = req.user._id;
        const groupId = req.params.id;
        const newAdminId = req.body.newAdminId; 

        if (!groupId) {
            return res.status(400).json({ message: "No group ID provided" });
        }
        if (!newAdminId) {
            return res.status(400).json({ message: "No admin ID provided" });
        }


        const checkGroup = await Group.findById(groupId);
        if (!checkGroup) {
            return res.status(404).json({ message: "Group not found" });
        }


        const isAdmin = checkGroup.admins.some(admin => admin.toString() === userId.toString());
        if (!isAdmin) {
            return res.status(403).json({ message: "You are not authorized to add admins" });
        }

        if (checkGroup.admins.includes(newAdminId)) {
            return res.status(400).json({ message: "User is already an admin" });
        }

        const isMember = checkGroup.members.includes(newAdminId);
        if (!isMember) {
            return res.status(400).json({ message: "User must be a member before being added as an admin" });
        }

        checkGroup.admins.push(newAdminId);
        await checkGroup.save();

        return res.status(200).json({ message: "Admin added successfully", group: checkGroup });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error", error: err });
    }
};


const Deleteadmins = async(req,res)=>{
    try{
        const userId = req.user._id;
        const groupId = req.params.id;
        const adminId = req.body.adminId
    
        if (!groupId){
                return res.status(500).json({message:"No group id"})
        }
        checkGroup = await Group.findById(groupId)
        if(!checkGroup){
            return res.status(404).json({message:"No group found"})
        }
        if(!checkGroup.admins.includes(userId)){
            return res.status(500).json({message:"you are not an admin in this group"})
        }
        if(!checkGroup.admins.includes(adminId)){
            return res.status(400).json({message:"the user is not a member in the group"})
        }
        await checkGroup.members.pull(adminId)
        checkGroup.save()
        return res.status(200).json({message:`${adminId} deleted successfully`})
    }catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error", error: err });
    }
};

const Addmembers = async(req,res)=> {
    try{
        const userId = req.user._id;
        const groupId = req.params.id;
        const newMemberId = req.body.newMemberId
    
        if (!groupId){
                return res.status(500).json({message:"No group id"})
        }
        checkGroup = await Group.findById(groupId)
        if(!checkGroup){
            return res.status(404).json({message:"No group found"})
        }
        if(!checkGroup.admins.includes(userId)){
            return res.status(500).json({message:"you are not an admin in this group"})
        }
        if(checkGroup.members.includes(newMemberId)){
            return res.status(400).json({message:`the ${newMemberId} is already a member`})
        }
        await checkGroup.members.push(newMemberId)
        checkGroup.save()
        return res.status(200).json({message:`${newMemberId} added successfully`})
    }catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error", error: err });
    }
};

const Deletemembers = async(req,res)=>{
    try{
        const userId = req.user._id;
        const groupId = req.params.id;
        const memberId = req.body.memberId
    
        if (!groupId){
                return res.status(500).json({message:"No group id"})
        }
        checkGroup = await Group.findById(groupId)
        if(!checkGroup){
            return res.status(404).json({message:"No group found"})
        }
        if(!checkGroup.admins.includes(userId)){
            return res.status(500).json({message:"you are not an admin in this group"})
        }
        if(!checkGroup.members.includes(memberId)){
            return res.status(400).json({message:"the user is not a member in the group"})
        }
        await checkGroup.members.pull(memberId)
        checkGroup.save()
        return res.status(200).json({message:`${memberId} deleted successfully`})
    }catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error", error: err });
    }
};


module.exports = { Addadmins,Addmembers,Deletemembers };
