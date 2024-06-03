import whois from "whois"

const lookup = (url)=> new Promise(res => {
    whois.lookup(url, (err, data)=> {
        res(data)
    })
})

export default defineEventHandler(async(event)=>{
    const body = await readBody(event)
    return await lookup(body.url)
})