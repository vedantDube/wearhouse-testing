"use client";

import { useEffect, useState } from 'react';
import { ExternalLink, Video, Image as ImageIcon, AlertTriangle } from 'lucide-react';

export default function EvidenceTable() {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/evidence')
      .then(res => res.json())
      .then(data => {
        if (data.evidence) setEvidenceList(data.evidence);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Loading Secure Evidence Logs...</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold uppercase tracking-widest text-slate-800 text-sm">Media & Evidence Logs</h3>
        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-bold uppercase">{evidenceList.length} Records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reference (AWB / LPN)</th>
              <th className="px-4 py-3">Uploader</th>
              <th className="px-4 py-3">Drive Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {evidenceList.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-slate-600">
                  {new Date(record.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {record.type === 'RECEIVER_REJECTION' ? <AlertTriangle size={14} className="text-red-500" /> : 
                     record.type === 'INSPECTION_VIDEO' ? <Video size={14} className="text-blue-500" /> : 
                     <ImageIcon size={14} className="text-amber-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{record.type.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                  {record.manifest?.trackingAwb || record.returnItem?.lpn || record.rawReference || 'UNKNOWN'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {record.user?.email || 'System Default'}
                </td>
                <td className="px-4 py-3">
                  <a href={record.driveLink} target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider transition-colors">
                    <ExternalLink size={14} />
                    <span>View File</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}