import dns from "node:dns"

const Resolver = dns.promises

export default defineEventHandler(async(event)=>{
    const body = await readBody(event)
    const url = body.url
    return await Resolver.resolveAny(url)
})
