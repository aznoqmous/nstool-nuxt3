<template>
  <UContainer>
    <div class="mt-5 flex justify-between">
      <h1>NSTool</h1>
      <ColorScheme><USelect v-model="$colorMode.preference" :options="['system', 'light', 'dark']" /></ColorScheme>
    </div>
    <div class="mt-5 flex justify-between">
      <UForm :state="state" @submit="search">
        <UFormGroup>
          <UButtonGroup>  
            <UInput v-model="state.url" class="min-w-80"/>
            <UButton type="submit">Lookup</UButton>
          </UButtonGroup>
        </UFormGroup>
      </UForm>
    </div>
    <div class="mt-5 flex items-center text-xl text-primary-400" v-if="currentDomain">
      <UIcon name="i-heroicons-link" />
      <ULink
      :to="'http://'+state.url"
      target="_blank"
      >
      {{ currentDomain }}
    </ULink>
  </div>
    
    <UCard v-if="nslookupLoading || records" class="mt-5">
      <h2><strong>DNS</strong></h2>
      <UProgress carousel v-if="nslookupLoading"></UProgress>
      <div v-else>
          <UTable
          v-if="records && records.length"
          :rows="records"
          :columns="columns"
          :ui="{td: {padding: 'py-1 px-4'}}"
          >
        </UTable>
        <p v-else class="text-slate-400">No DNS records found</p>
      </div>
    </UCard>
    <UCard v-if="certificateLoading || (cert && cert.issuer)" class="mt-5">
      <h2><strong>SSL</strong></h2>
      <UProgress carousel v-if="certificateLoading"></UProgress>
      <p v-else class="text-slate-400">
        {{ cert.issuer.O }}<br>
        {{ cert.valid_to }} - {{ cert.valid_from }}
      </p>
    </UCard>
    <UCard v-if="whoisLoading || whoisTabs.length" class="mt-5">
      <h2><strong>Who is</strong></h2>
      <UProgress carousel v-if="whoisLoading"></UProgress>
      <UTabs v-else
        :items="whoisTabs"
        class="w-full"
        >
        <template #raw="item">
          <p v-html="whoisText" class="text-slate-400"></p>
        </template>
        <template #parsed="item">
          <UTable
          
          :rows="whoisRows"
          :ui="{td: {padding: 'py-1 px-4'}}"
          >
          <template #key-data="{row}">
            <span class="text-slate-100">{{ row.key }}</span>  
          </template>
          <template #value-data="{row}">
            <span class="text-slate-400">{{ row.value }}</span>  
          </template>
          </UTable>
        </template>
      </UTabs>
    </UCard>
  </UContainer>
</template>
<script setup>
const columns = ref([
  {
    key: "type",
    label: "Type"
  },
  {
    key: "value",
    label: "Value"
  },
  {
    key: "ttl",
    label: "TTL"
  },
  {
    key: "priority",
    label: "Priority"
  }
])
const state = ref({})
const records = ref(null)

const currentDomain = ref(null)
const cert = ref(null)
const whoisRows = ref([])
const whoisText = ref(null)

const cleanUrl = (url)=>{
  url = url.trim()
  if(!url.match(/^http/)) url = `http://${url}`
  url = new URL(url).hostname
  return url
}

const search = async()=>{
  cert.value = null
  whoisRows.value = []
  records.value = null
  state.value.url = cleanUrl(state.value.url) 
  const {url} = state.value
  currentDomain.value = url

  
  nslookup(url)
  certificate(url)
  whois(url)
}

const nslookupLoading = ref(false)
const nslookup = async(url)=>{
  nslookupLoading.value = true
  try {

    let res = await $fetch("/api/lookup", {
      method: "POST",
      body: {
        url
      }
    })
    const recs = []

    res.map(field => field.entries.map(row => recs.push({
      type: field.type,
      value: row.value || row.address || row.exchange || (row.entries && row.entries.join && row.entries.join(' ')) || (row.join && row.join(' ')) || row,
      ttl: row.ttl,
      priority: row.priority
    })))
    
    console.log(res)
    // res = res.map(row => ({
    //   type: row.type,
    //   value: row.value || row.address || row.exchange || row.entries.join(' '),
    //   ttl: row.ttl,
    //   priority: row.priority
    // }))
    records.value = recs
  }
  catch(error){
    console.error(error)
  }
  
  nslookupLoading.value = false
}

const certificateLoading = ref(false)
const certificate = async(url)=>{
  certificateLoading.value = true
  cert.value = await $fetch("/api/cert", {
    method: "POST",
    body: {
      url
    }
  })
  certificateLoading.value = false
}

const whoisLoading = ref(false)
const whoisTabs = ref([])
const whois = async(url)=> {
  whoisLoading.value = true
  let res = await $fetch("/api/whois", {
    method: "POST",
    body: {
      url
    }
  })

  whoisText.value = res.replace(/\n/g, "<br>")
  res = res
  .split(/\r\n/)
  .map(line => line.match(/^([^\:]*?):[ ]*?([^ ].*?)$/))
  .map(match => (match ? {
    key: match[1],
    value: match[2]
  } : {key: "", value: ""}))

  whoisRows.value = res

  whoisLoading.value = false

  whoisTabs.value = [{
    "label": "Raw",
    "slot": "raw"
  },
  {
    "label": "Parsed",
    "slot": "parsed"
  }]
}

</script>
<style>
h2 {
  display: block;
  width: 100%;
  text-align: center;
  margin-bottom: 1rem;
}
</style>