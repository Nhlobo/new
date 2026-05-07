import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:8080');

export default function App() {
  const [live, setLive] = useState([]);
  useEffect(() => {
    socket.on('sensor:update', (data) => setLive((prev) => [...prev.slice(-24), { t: new Date().toLocaleTimeString(), ...data }]));
    return () => socket.off('sensor:update');
  }, []);
  const latest = live[live.length - 1] || {};
  return (
    <div style={{fontFamily:'Inter, sans-serif', padding:20, background:'#0f172a', color:'white', minHeight:'100vh'}}>
      <h1>WaterWise Admin Dashboard</h1>
      <p>Real-time farm monitoring and control center.</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12}}>
        {['moisture','tankLevel','temperature','flowRate','battery'].map(k=><div key={k} style={{background:'#1e293b',padding:16,borderRadius:14}}><b>{k}</b><div>{latest[k] ?? '--'}</div></div>)}
      </div>
      <div style={{height:280, background:'#1e293b', marginTop:18, borderRadius:14, padding:12}}>
        <ResponsiveContainer width='100%' height='100%'><LineChart data={live}><XAxis dataKey='t'/><YAxis/><Tooltip/><Line dataKey='moisture' stroke='#22d3ee'/><Line dataKey='tankLevel' stroke='#86efac'/></LineChart></ResponsiveContainer>
      </div>
    </div>
  );
}
