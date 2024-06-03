import dns from "node:dns"

const Resolver = dns.promises

export default defineEventHandler(async(event)=>{
    const body = await readBody(event)
    const url = body.url
    // return await Resolver.resolveAny(url)

    const lookup = []

    await dnsQuery("resolve4", "A", url)
    await dnsQuery("resolve6", "AAAA", url)
    await dnsQuery("resolveCname", "CNAME", url)
    await dnsQuery("resolveNs", "NS", url)
    await dnsQuery("resolveMx", "MX", url)
    await dnsQuery("resolveTxt", "TXT", url)

    async function dnsQuery(funcName, type, url){
        const entries = await dnsFunction(funcName, url)
        if(entries) {
            lookup.push({
                type, entries
            })
        }
    }
    async function dnsFunction(funcName, url){
        try {

            const result = await Resolver[funcName](url)
            return result
        }
        catch(e){
            return null
        }
    }

    return lookup
})


