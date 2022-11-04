const mongoose=require('mongoose');
const dotenv=require('dotenv');
process.on('uncaughtException',err=>{
    console.log('Uncaught Exception Shutting down');
    console.log(err.name,err.message);
        process.exit(1);
});
dotenv.config({path:'./config.env'});


const app=require('./app');

const DB=process.env.DATABASE.replace
    ('<PASSWORD>',process.env.DATABASE_PASSWORD
);
//change only url for local database
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
    //console.log(con.connections);
    console.log("DB CONNECTION SUCCESFUL");
});



/*const testTour =new Tour({
    name:'The Park Camper',
    price:997   
});
testTour.save().then(doc=>{
    console.log(doc);
}).catch(err=>{
    console.log('ERROR',err);
});
*/
//console.log(app.get('env'));//express sets this
//console.log(process.env);//node also sets a lot of environment variables
//console.log(process.env.PORT);
const port=process.env.PORT ||3000;
const server=app.listen(port,()=> {
    console.log(`server listening port ${port}...`);
});

process.on('unhandledRejection',err=>{
    console.log(err.name,err.message);
    console.log('unhandled rejection shutting down');
    server.close(()=>{
        process.exit(1);

    });
    //give server time to process pending request

    
    0//success
    1 //uncaught exception
});



//console.log(x);

