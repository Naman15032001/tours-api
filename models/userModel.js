const crypto=require('crypto');
const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please tell your name']
    },
    email:{
        type:String,
        required:[true,'Please provide your email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a Valid email']
    },
    photo: String,
    role:{
        type:String,
        enum:['user','guide','lead-guide','admin'],
        default:'user'

    },
    password:{
        type:String,
        required:[true,'Please provide your password'],
        minlength:8,
        select:false

    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{
            //only works on save /create
            validator:function(el){
                return el===this.password;

            },
            message:'Password not same'
        }

    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
    

});

userSchema.pre('save',async function(next){
    //only run for pswd modification 
    if(!this.isModified('password')) return next();
    //cost 12

    this.password= await bcrypt.hash(this.password,12);
    //delete pwd confirm

    this.passwordConfirm = undefined;
    next();

});
userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt=Date.now() -1000;
    next();

    

});

userSchema.pre(/^find/,function(next){
    //this points to current query
    this.find({active:{$ne :false}});
    next();

});

//instance method all documents of collection
userSchema.methods.correctPassword =async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);

};

userSchema.methods.changedPasswordAfter= function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp=parseInt(this.passwordChangedAt.getTime() /1000,10);
       // console.log(changedTimestamp,JWTTimestamp);
        return JWTTimestamp<changedTimestamp;

    }
    //no change
    return false;

}
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
  
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
  
    console.log({ resetToken }, this.passwordResetToken);
  
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
    return resetToken;
  };


const User=mongoose.model('User',userSchema);
module.exports=User;