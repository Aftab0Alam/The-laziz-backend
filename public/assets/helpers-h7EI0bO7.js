var e=(e,t)=>{let{orderCode:n,items:r,deliveryAddress:i,subtotal:a,deliveryCharge:o,discountAmount:s,totalAmount:c,specialInstructions:l,customerPhone:u}=e,d=`🍽 *NEW ORDER — LAZIZ RESTAURANT*
━━━━━━━━━━━━━━━━━━━━━━
📋 *Order ID:* ${n}
📅 *Date:* ${new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}, ${new Date().toLocaleTimeString(`en-IN`,{hour:`2-digit`,minute:`2-digit`})}
━━━━━━━━━━━━━━━━━━━━━━
🛒 *ORDER ITEMS:*
${r.map(e=>`• ${e.name} ×${e.quantity} = ₹${e.subtotal}`).join(`
`)}
━━━━━━━━━━━━━━━━━━━━━━
📍 *DELIVERY TO:*
${i.recipientName||i.label}
${u}
${i.street}${i.landmark?`, Near `+i.landmark:``}
${i.area}, ${i.city} — ${i.postalCode}
━━━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY:*
Subtotal:        ₹${a}
Delivery:         ₹${o}
Discount:        -₹${s||0}
*Total:           ₹${c}*
━━━━━━━━━━━━━━━━━━━━━━
💵 Payment: Cash on Delivery${l?`\n📝 Note: ${l}`:``}
━━━━━━━━━━━━━━━━━━━━━━
_Powered by Laziz Restaurant App_`,f=encodeURIComponent(d);return`https://wa.me/${t.replace(/[^0-9]/g,``)}?text=${f}`},t=e=>new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}),n=(e,t)=>!t||t>=e?0:Math.round((e-t)/e*100);export{t as n,n as r,e as t};