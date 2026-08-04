class ApiError extends Error{
    constructor(
        statusCode,message="Somethign went wrong",
        error=[],
        statck=""
    ){
        super(message)
        this.statusCode=statusCode
        this.message=message
        this.data=null
        this.success=false
        this.errors=error

        if(statck){
            this.stack=statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }


}

export {ApiError}