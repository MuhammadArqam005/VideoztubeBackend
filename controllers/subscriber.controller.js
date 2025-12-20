import Subscription from "../models/subscription.model.js";

const toggleSubscribeBtn = async (req,res)=>{
    try{
    const {id} = req.params
    const user = req.user._id
   const subscriptionDetails =  await Subscription.findOneAndDelete({
        subscriber : user,
        channel : id
    })
    if(!subscriptionDetails){
     const subscriptionCreate = await Subscription.create({
        subscriber : user,
        channel : id
     }) 
    return res.status(200).json({
        isSubscribed : true
    });
    }

    return res.status(200).json({
        isSubscribed : false
    });
}
    catch(err){
    res.status(500).json(err.message)
    }
}

export {toggleSubscribeBtn}