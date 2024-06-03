import https from "https"

const getCertificate = async(url)=> new Promise(resolve => {
    const req = https.request({
        host: url,
        port: 443,
        method: "GET",
        agent: new https.Agent({
            maxCachedSessions: 0
        })
    }, (res)=>{
        const cert = res.socket.getPeerCertificate()
        resolve(cert)
    })
    req.end()
    
})
export default defineEventHandler(async(event)=>{
    const body = await readBody(event)
    
    return await getCertificate(body.url)
})