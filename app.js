const fs=require('fs');
const express=require('express');
const morgan=require('morgan');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
const AppError=require('./utils/appError');
const globalErrorHandler =require('./controllers/errorController');

const tourRouter=require('./routes/tourRoutes');
const userRouter=require('./routes/userRoutes');
const reviewRouter=require('./routes/reviewRoutes');
const app=express();
// 1) MIDDLEWARES
//security http headers
app.use(helmet());
if(process.env.NODE_ENV === 'development'){
   
    app.use(morgan('dev'));
}
//limit req from same api
const limiter=rateLimit({
    max:100,
    windowMs:60 * 60 * 100,
    message:'Too many req from this ip pls try again in an hr'

});
app.use('/api',limiter);

//body parser into req.body
app.use(express.json({limit:'10kb'}));

//clean data sanitization against nosql query injection and against xss attacks cross site scripting
app.use(mongoSanitize());

app.use(xss());
//clean user from malicious html code

//prevent parameter pollution
app.use(hpp({
    whitelist:['duration','ratingsAverage','ratingsQuantity','maxGroupSize','difficulty','price']
}));



//serving static files
app.use(express.static(`${__dirname}/public`));
/*app.use((req,res,next)=>{
    console.log('Hello from the middleware');
    next();
});*/
app.use((req,res,next)=>{
    req.requestTime=new Date().toISOString();
    //console.log(req.headers);
    next();
});

/*app.get("/",(req,res)=>{
    res.status(200).json({name :"NAMAN JAIN"});        
});
app.post("/",(req,res)=>{
    res.status(200).send("YOU CAN POST HERE");        
});
*/
//2) ROUTE HANDLERS



/*app.get("/api/v1/tours",getAllTours);
app.get("/api/v1/tours/:id",getTour);
app.post("/api/v1/tours",createTour);
app.patch("/api/v1/tours/:id",updateTour);
app.delete("/api/v1/tours/:id",deleteTour);
*/
//3) ROUTES
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
//neither of them able to catch it
app.all('*',(req,res,next)=>{

   /* res.status(404).json({
        status:'fail',
        message:`cant find ${req.originalUrl} on this server!`

    });*/
  /*  const err=new Error(`cant find ${req.originalUrl} on this server!`
    );
    err.status='fail';
    err.statusCode=404;
    next(err);//automatically assumes error when we pass an argument 
    //pass to global handling middleware skip all midlewares*/
    next(new AppError(`cant find ${req.originalUrl} on this server!`,404));

});

app.use(globalErrorHandler);

module.exports=app;


 
  
    //4) START THE SERVER   


