const asyncHandler= (requestHandler)=>{
    return async (req,res,next)=>{
        try {
            await requestHandler(req,res,next)
        } catch (err) {
            res.status(err.code || 400).json({
                success: false,
                message: err.message
            })
        }
    }

}

export {asyncHandler}