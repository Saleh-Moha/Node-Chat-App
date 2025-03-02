const Group = require('../models/Group');

module.exports = (...roles)=>{
    return (req,res,next)=>{
        if(!Group.admin.includes(req.user) === roles){
            res.status(400).json({message:"you are not allowed to do that"})
        }
        else{
            next();
        }
    }
}