const User = require('./../models/userModel');
const AppError=require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const { login } = require('./authController');
const factory=require('./handlerFactory');

const filterObj=(obj, ...allowedFields)=>{
    const newObj={};
    Object.keys(obj).forEach(el=>{
        if(allowedFields.includes(el)){
            newObj[el]= obj[el];

        }
    })
    return newObj;

};

exports.getAllUsers=factory.getAll(User);


exports.getMe=(req,res,next)=>{
    req.params.id=req.user.id;
    next();
    
};



exports.updateMe=catchAsync(async(req,res,next)=>{
    // 1) create if user posts pwd data
    if(req.body.password || req.body.passwordConfirm ){
        return next(new AppError('this route not for update pwd pls use /updateMyPassword',400));

    }
    const filteredBody=filterObj(req.body,'name','email');
    const updatedUser=await User.findByIdAndUpdate(req.user.id,filteredBody,{
        new:true,
        runValidators:true
    });
    

    res.status(200).json({
        status:'success',
        data:{
            user:updatedUser
        }

    });


    //2) update user document

});

exports.deleteMe=catchAsync(async (req,res,next)=>{

    await User.findByIdAndUpdate(req.user.id,{active:false});
    res.status(204).json({
        status:'success',
        data:null
    });
});

exports.getUser=factory.getOne(User);
exports.createUser=(req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route not defined! use sign up instead'
    });
};

//do not update pwd with this
exports.updateUser=factory.updateOne(User);
exports.deleteUser=factory.deleteOne(User);