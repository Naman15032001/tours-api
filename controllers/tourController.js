
//const { delete } = require('../routes/tourRoutes');
const Tour = require('./../models/tourModel');
const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { Query } = require('mongoose');
const factory=require('./handlerFactory');




exports.aliasTopTours=(req,res,next)=>{
    req.query.limit='5';
    req.query.sort='-ratingsAverage,price';
    req.query.fields='name,price,ratingsAverage,summary,difficulty';
    next();
}



/*const tours=JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);
*/
/*exports.checkID=(req,res,next,val)=>{
    console.log(`Tour id is: ${val}`);
    const id=req.params.id *1;
    if(id >tours.length){
        return res.status(404).json({
                status:'fail',
                message : 'Invalid ID'
            });
    }
    next();

}
*/
/*exports.checkBody=(req,res,next)=>{
    if(!req.body.name || !req.body.price){
        return res.status(400).json({
            status:'fail',
            message:'missing name or price'
        });
    }
    next();

}*/
//filtering
      /*  const queryObj ={...req.query};//hard copy (new)

        const excludedFields=['page','sort','limit','fields'];

        excludedFields.forEach(el=> delete queryObj[el]);

       // console.log(req.query,queryObj);
       console.log(req.query);

       //advance filtering
       /*const tours=await Tour.find({
        duration:{$gte:5}, //in req.query no $ sign
        difficulty:'easy'
    });
    let queryStr=JSON.stringify(queryObj);
    queryStr=queryStr.replace(/\b(gte|gt|lt|lte)\b/g,match=>`$${match}`);
   // console.log(JSON.parse(queryStr));


        //first built then execute
        let query=Tour.find(JSON.parse(queryStr));*/



       /* if(req.query.sort){
            const sortBy=req.query.sort.split(',').join(' ');
            //console.log(sortBy);
            query=query.sort(sortBy);
            //sort('price ratingsAverage')

        }
        else{
            query=query.sort('-createdAt');

        }*/
        //3)) field limiting projecting
       /* if(req.query.fields){
            const fields=req.query.fields.split(',').join(' ');
            
            query=query.select(fields);
        

        }
        else{
            query=query.select('-__v');

        }*/
        //feature 4 pagination
        /*
        const page=req.query.page*1 || 1;
        const limit=req.query.limit*1 || 100;
        const skip=(page-1)*limit;
        //page=2&limit=10 1-10 on page1 11-20 page 2
        query=query.skip(skip).limit(limit);

        if(req.query.page){
            const numTours =await Tour.countDocuments();
            if(skip >= numTours) throw new Error('This Page doesnt exist')

        }*/
/*const tours=await Tour.find({
        duration:5,
        difficulty:'easy'
    });*/
    /*const tours=await Tour.find()
        .where('duration')
        .equals(5)
        .where('difficulty')
        .equals('easy')*/
   // console.log(req.requestTime);

exports.getAllTours= factory.getAll(Tour);
exports.getTour = factory.getOne(Tour,{path:'reviews'});
   //console.log(req.params);
    //const id=req.params.id *1;
    // const tour= tours.find(el=> el.id===id);
    
        
        //Tour.findOne({_id:req.params.id}) short hand

      

exports.createTour = factory.createOne(Tour);
/*exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
  
    if (!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  });*/

 exports.updateTour=factory.updateOne(Tour); 
 /* exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
  
    if (!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }
  
    res.status(204).json({
      status: 'success',
      data: null
    });
  });*/
  exports.deleteTour=factory.deleteOne(Tour);

exports.getTourStats=catchAsync(async (req,res,next) => {

   
        const stats= await Tour.aggregate([
            {
                $match:{ratingsAverage:{$gte:4.5}}
            },
            {
                $group:{
                    //_id:null,
                    _id:{$toUpper:'$difficulty'},
                    numTours:{$sum:1},
                    numRatings:{$sum:'$ratingsQuantity'},
                    avgRating:{ $avg :'$ratingsAverage'},
                    avgPrice:{ $avg :'$price'},
                    minPrice:{ $min :'$price'},
                    maxPrice:{ $max :'$price'}
                }
            },
            {
                    $sort:{avgPrice:1}

            },
            /*{
                    $match:{_id:{ $ne :'EASY'}}
            }*/



        ]);
        res.status(200).json({
            status:'success',
            data:{
                stats:stats
            }
        }); 


   
});
exports.getMonthlyPlan=catchAsync(async (req,res,next)=>{
    
        const year=req.params.year*1;
        const plan= await Tour.aggregate([
            {
                $unwind:'$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }

            },
            {
                $group:{
                    _id:{$month:'$startDates'},
                    numTourStarts:{$sum:1},
                    tours:{ $push : '$name'}
                }
            },
            {
                $addFields:{month:'$_id'}
            },
            {
                $project:{
                    _id:0
                }
            },
            {
                $sort:{ numTourStarts:-1}
            },
            {
                $limit:12
            }


        ]);
        res.status(200).json({
            status:'success',
            data:{
                plan:plan
            }
        }); 

    

});
  // /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin=catchAsync( async (req,res,next)=>{

   const  {distance,latlng,unit}=req.params;

   const [lat,lng]=latlng.split(',');

   const radius=unit ==='mi' ? distance/3963.2 :distance/6378.1

   if(!lat ||!lng){
    return next(new AppError('Please provide lat and lng in format lat,lng.', 400));

   }

   console.log(distance,lat,lng,unit);

   const tours= await Tour.find(
       {startLocation:
        { $geoWithin :
             {
                $centerSphere:[[lng,lat],radius]
             }
        }
        });

   res.status(200).json({
       status:'success',
       results:tours.length,
       data:{
           data:tours
       }


   });



});

// '/distances/:latlng/unit/:unit').get(tourController.getDistances);

exports.getDistances=catchAsync(async (req,res,next)=>{
    const  {latlng,unit}=req.params;

   const [lat,lng]=latlng.split(',');

   const multiplier=unit==='mi'?0.000621371:0.001;


   

   if(!lat ||!lng){
    return next(new AppError('Please provide lat and lng in format lat,lng.', 400));

   }

   const distances =await Tour.aggregate([
       {
           $geoNear:{
               near:{
                   type:'Point',
                   coordinates:[lng*1,lat*1]
               },
               distanceField:'distance',
               distanceMultiplier:multiplier
           }
       },
       {
           $project:{
               distance:1,
               name:1
           }

       }


   ]);
   res.status(200).json({
    status:'success',
    data:{
        data:distances
    }


});



});