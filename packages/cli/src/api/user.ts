import axios from 'axios'



export async function loginApi(server:string,obj:Object) {
    const url = `${server}sys-extension-api/func/password-login`;
    const result = await axios.post(url,obj)

    const response =  result.data

    if(response.code!=0){
        return false
    }

    console.log(response.data)

    return {access_token:response.data.access_token,expire_time:response.data.expire}

    
}