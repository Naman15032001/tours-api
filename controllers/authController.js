const crypto=require('crypto');
const { promisify }=require('util');
const jwt=require('jsonwebtoken');
const User=require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const sendEmail=require('./../utils/email');
const signToken=id=>{
     return jwt.sign({id:id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken =(user,statusCode,res)=>{
    const token=signToken(user._id);

    const cookieOptions={
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN *24 * 60 * 60 * 1000),
        httpOnly:true
    };
    if(process.env.NODE_ENV==='production') cookieOptions.secure=true;

    res.cookie('jwt',token,cookieOptions);
    //remove pwd from output

    user.password=undefined;

    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    });
};
exports.signup= catchAsync (async(req,res,next)=>{
  const newUser=await User.create(req.body);
  /*const newUser=await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
  });*/
  

  createSendToken(newUser,201,res);

    
});

exports.login= catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;

    //check if email and pwd exists
    if(!email || !password){
        return next(new AppError('Please provide email and password !',400));

    }


    //check user exzits and pwd correct
    const user= await User.findOne({email}).select('+password');
    //console.log(user);
    if(!user || !await user.correctPassword(password,user.password)){
        return next(new AppError('Incorrect email and password !',401));
    }



    //everythin okay send jwt to client
    createSendToken(user,200,res);

    
});

exports.protect=catchAsync(async (req,res,next)=>{
    // get token and check if exists
    let token;
if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token =req.headers.authorization.split(' ')[1];
}
    //console.log(token);
    if(!token){
        return next(new AppError('you are not logged in please login to get access',401));

    }


    //validate token verification
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    //console.log(decoded);
    //check if user still exists current user
     const freshUser=await User.findById(decoded.id);
     if(!freshUser){
         return next(new AppError('The user belonging to this token  no longer exists',401));
     }
    //check if user change pwd after the jwt token was issued

    if(freshUser.changedPasswordAfter(decoded.iat)){
     return next(new AppError('User recently changed password login again',401));

    }


    // access granted
    req.user=freshUser;
    next();

});
//wrapper return midlleware array of arguments
//roles array
exports.restrictTo=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
        return next(new AppError('You dont have permission to do this action',403));
        }
        next();

    };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with email address.', 404));
    }
  
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
  
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
  
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message
      });
  
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
     user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
  
      return next(
        new AppError('There was an error sending the email. Try again later!'),
        500
      );
    }
  });
exports.resetPassword=catchAsync(async (req,res,next)=>{

    //get user based on token
    const hashedToken=crypto.createHash('sha256')
                            .update(req.params.token)
                            .digest('hex');
    const user =await User.findOne({
            passwordResetToken:hashedToken,
            passwordResetExpires:{$gt: Date.now()}
        });                       
    //set new pwd if token not expired and a user 
    if(!user){
        return next(
            new AppError('The token has expired or invalid'),
            400
          );

    }
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user,200,res);
    





    //update change pwd at property for the current user



    //log the user in send jwt

});
exports.updatePassword = catchAsync(async(req,res,next)=>{
    // get the user from collection

    const user=await User.findById(req.user.id).select('+password');



    //check if posted pwd correct
    if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
        return next(new AppError('your curr pwd is wrong ', 401));

    }



    //if pwd correct then update
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    await user.save();
//FIND BY ID AND UPDATE VALIDATION NOT WORK PRE SAVE MIDDLEWARE NOT WORK

    createSendToken(user,200,res);

    //log the user in 

});