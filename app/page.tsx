"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays,
  CheckCircle2, CircleDollarSign, ClipboardList, Clock3, Crown, Database, Download,
  FileCheck2, FileSpreadsheet, FileText, FolderKanban, History, ImageIcon, LayoutDashboard,
  Link2, ListChecks, MessageSquareText, Pencil, Plus, Search, Sparkles, Trash2, Upload,
  UserRoundCog, UsersRound, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type Kind = "project" | "building" | "category" | "task" | "submission" | "contractor" | "payment" | "milestone" | "log" | "workflow";
type FileState = "SAVED_ONEDRIVE" | "MISSING_OR_INCORRECT";
type Item = {
  id:number; kind:Kind; projectId:number|null; parentId:number|null; code:string; title:string; description:string;
  status:string; priority:string; health:string; lifecycle:string; phase:string; company:string; owner:string;
  followPerson:string; nextAction:string; followUpDate:string|null; startDate:string|null; dueDate:string|null;
  previousDeadline:string|null; changeReason:string|null; estimatedMonths:number|null; progress:number; quantityProgress:number;
  currentHolder:string; holdingSince:string|null; contractValue:number; amount:number; paidAmount:number; paymentRound:string;
  skippedReason:string|null; skipApproved:boolean; imagePath:string|null; imageTitle:string|null; fileName:string|null;
  fileUrl:string|null; fileStorageStatus:FileState; fileStorageNote:string|null; createdAt:string; updatedAt:string;
};

const nav = [
  ["dashboard","Tổng quan",LayoutDashboard],["brief","Daily Brief",Sparkles],["projects","Dự án",BriefcaseBusiness],
  ["buildings","Công trình",Building2],["categories","Hạng mục",FolderKanban],["tasks","Công việc theo dõi",ListChecks],
  ["submissions","Tờ trình",FileText],["payments","Thanh toán",CircleDollarSign],["contractors","Nhà thầu",UsersRound],
  ["timeline","Timeline",CalendarDays],["logs","Nhật ký",History],["files","Kiểm tra file",FileCheck2],["data","Dữ liệu",Database],
] as const;
const kindLabel:Record<Kind,string>={project:"Dự án",building:"Công trình",category:"Hạng mục",task:"Công việc",submission:"Tờ trình",contractor:"Nhà thầu",payment:"Thanh toán",milestone:"Mốc",log:"Nhật ký",workflow:"Bước quy trình"};
const viewKind:Record<string,Kind|undefined>={projects:"project",buildings:"building",categories:"category",tasks:"task",submissions:"submission",payments:"payment",contractors:"contractor",logs:"log"};
const createKind:Record<string,Kind>={projects:"project",buildings:"building",categories:"category",tasks:"task",submissions:"submission",payments:"payment",contractors:"contractor",timeline:"milestone",logs:"log"};
const dateToday=()=>new Date().toISOString().slice(0,10);
const emptyForm={
  kind:"category" as Kind,code:"",title:"",description:"",projectId:"",parentId:"",status:"Đang thực hiện",
  priority:"Trung bình",health:"Đúng tiến độ",lifecycle:"Đã chốt",phase:"",company:"",owner:"",followPerson:"",
  nextAction:"",followUpDate:"",startDate:"",dueDate:"",previousDeadline:"",changeReason:"",estimatedMonths:"",
  progress:"0",quantityProgress:"0",currentHolder:"",holdingSince:"",contractValue:"0",amount:"0",paidAmount:"0",
  paymentRound:"",skippedReason:"",skipApproved:false,imagePath:"",imageTitle:"",fileName:"",fileUrl:"",
  fileStorageStatus:"MISSING_OR_INCORRECT" as FileState,fileStorageNote:"",
};
const money=(v:number)=>new Intl.NumberFormat("vi-VN").format(v)+" ₫";
const remaining=(v:string|null)=>v?Math.ceil((new Date(v).getTime()-Date.now())/86400000):null;
const holding=(v:string|null)=>v?Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/86400000)):0;

export default function Home(){
  const [items,setItems]=useState<Item[]>([]);
  const [active,setActive]=useState("dashboard");
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [formOpen,setFormOpen]=useState(false);
  const [editing,setEditing]=useState<number|null>(null);
  const [form,setForm]=useState(emptyForm);
  const [detail,setDetail]=useState<Item|null>(null);
  const [image,setImage]=useState<Item|null>(null);
  const [deleting,setDeleting]=useState<Item|null>(null);

  async function refresh(){
    try{const r=await fetch("/api/items");const d=await r.json() as {error?:string;items?:Item[]};if(!r.ok)throw new Error(d.error);setItems(d.items??[])}
    catch{toast.error("Chưa tải được dữ liệu.")}
    finally{setLoading(false)}
  }
  useEffect(()=>{void refresh()},[]);

  const projects=items.filter(x=>x.kind==="project");
  const buildings=items.filter(x=>x.kind==="building");
  const categories=items.filter(x=>x.kind==="category");
  const tasks=items.filter(x=>x.kind==="task");
  const submissions=items.filter(x=>x.kind==="submission");
  const payments=items.filter(x=>x.kind==="payment");
  const byId=(id:number|null)=>items.find(x=>x.id===id);
  const nameOf=(id:number|null)=>byId(id)?.title||"Chưa liên kết";
  const attention=items.filter(x=>["Đang bị nghẽn","Có rủi ro","Chậm tiến độ"].includes(x.health)||(x.followUpDate&&x.followUpDate<=dateToday())||(x.dueDate&&x.dueDate<=dateToday()));
  const missing=items.filter(x=>["category","task","submission"].includes(x.kind)&&x.fileStorageStatus==="MISSING_OR_INCORRECT");
  const filtered=useMemo(()=>{
    const k=viewKind[active];let list=k?items.filter(x=>x.kind===k):items;const q=query.trim().toLowerCase();
    return q?list.filter(x=>(x.title+" "+x.code+" "+x.company+" "+x.owner+" "+x.followPerson+" "+nameOf(x.parentId)).toLowerCase().includes(q)):list;
  },[items,active,query]);

  function openCreate(kind:Kind=createKind[active]||"category"){setEditing(null);setForm({...emptyForm,kind});setFormOpen(true)}
  function openEdit(x:Item){
    setEditing(x.id);
    setForm({...emptyForm,...Object.fromEntries(Object.entries(x).map(([k,v])=>[k,v??""])),projectId:x.projectId?String(x.projectId):"",parentId:x.parentId?String(x.parentId):"",estimatedMonths:x.estimatedMonths?String(x.estimatedMonths):"",progress:String(x.progress),quantityProgress:String(x.quantityProgress),contractValue:String(x.contractValue),amount:String(x.amount),paidAmount:String(x.paidAmount)} as typeof emptyForm);
    setFormOpen(true);
  }
  function chooseParent(id:string){const p=byId(Number(id));setForm(v=>({...v,parentId:id,projectId:p?.projectId?String(p.projectId):v.projectId}))}
  async function save(e:FormEvent){
    e.preventDefault();const r=await fetch("/api/items",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,id:editing})});const d=await r.json() as {error?:string};
    if(!r.ok)return toast.error(d.error||"Không thể lưu.");await refresh();setFormOpen(false);toast.success(editing?"Đã cập nhật.":"Đã tạo mới.");
  }
  async function remove(){
    if(!deleting)return;const r=await fetch("/api/items",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:deleting.id})});
    if(!r.ok)return toast.error("Không thể xóa.");setDeleting(null);setDetail(null);await refresh();toast.success("Đã xóa và ghi Nhật ký.");
  }
  async function markFile(x:Item){
    const r=await fetch("/api/items",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:x.id,fileStorageStatus:"SAVED_ONEDRIVE"})});
    if(!r.ok)return toast.error("Không thể cập nhật.");await refresh();toast.success("Đã xác nhận hồ sơ.");
  }
  async function exportExcel(){
    const XLSX=await import("xlsx");const wb=XLSX.utils.book_new();
    const sets:[string,Kind[]][]=[["projects",["project"]],["buildings",["building"]],["work_items",["category","workflow"]],["tracking_tasks",["task"]],["submissions",["submission"]],["payments",["payment"]],["contractors",["contractor"]],["timeline",["milestone"]],["activity_logs",["log"]]];
    sets.forEach(([name,kinds])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(items.filter(x=>kinds.includes(x.kind))),name));
    XLSX.writeFile(wb,"WorkOS_Backup_"+dateToday()+".xlsx");toast.success("Đã xuất backup Excel.");
  }
  async function importExcel(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;const XLSX=await import("xlsx");const wb=XLSX.read(await file.arrayBuffer());const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]]);let count=0;
    for(const row of rows){const title=String(row.title||row["Tên tờ trình"]||row["Tên"]||"").trim();if(!title)continue;const r=await fetch("/api/items",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...emptyForm,kind:"submission",title,status:String(row.status||row["Trạng thái"]||"Đang xử lý"),currentHolder:String(row.currentHolder||row["Đang ở đâu"]||"")})});if(r.ok)count++}
    await refresh();e.target.value="";toast.success("Đã nhập "+count+" tờ trình.");
  }

  const pageTitle=nav.find(x=>x[0]===active)?.[1]||"Tổng quan";
  return <SidebarProvider style={{"--sidebar-width":"16.5rem"} as React.CSSProperties}>
    <Sidebar collapsible="offcanvas" className="princess-sidebar">
      <SidebarHeader className="p-5"><div className="brand-card"><div className="brand-mark"><Crown/></div><div><b>WorkOS</b><small>Personal Project Control</small></div></div></SidebarHeader>
      <SidebarContent>
        <SidebarGroup><SidebarGroupLabel className="nav-label">ĐIỀU HÀNH</SidebarGroupLabel><SidebarGroupContent><SidebarMenu className="px-3">{nav.slice(0,6).map(([id,label,Icon])=><NavItem key={id} id={id} label={label} Icon={Icon} active={active} setActive={setActive}/>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
        <SidebarGroup><SidebarGroupLabel className="nav-label">VẬN HÀNH</SidebarGroupLabel><SidebarGroupContent><SidebarMenu className="px-3">{nav.slice(6).map(([id,label,Icon])=><NavItem key={id} id={id} label={label} Icon={Icon} active={active} setActive={setActive} badge={id==="files"?missing.length:0}/>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="sidebar-note"><Sparkles/>Nhập một nơi, các module liên quan tự cập nhật.</SidebarFooter>
    </Sidebar>
    <SidebarInset className="workspace">
      <header className="topbar"><SidebarTrigger className="md:hidden"/><div className="top-title"><span>ALMIRA · WORKOS V14</span><h1>{pageTitle}</h1></div><div className="search-box"><Search/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm nhà thầu, hạng mục, dự án..."/></div>{!["brief","data"].includes(active)&&<Button onClick={()=>openCreate()} className="rose-button"><Plus/>Tạo mới</Button>}</header>
      <main className="content">
        {active==="dashboard"&&<Dashboard projects={projects} categories={categories} tasks={tasks} submissions={submissions} payments={payments} attention={attention} missing={missing} nameOf={nameOf} onOpen={setDetail} onGoto={setActive} onQuick={()=>openCreate("log")}/>}
        {active==="brief"&&<DailyBrief attention={attention} submissions={submissions} payments={payments} onOpen={setDetail}/>}
        {active==="categories"&&<Board items={filtered} loading={loading} onOpen={setDetail} onEdit={openEdit}/>}
        {active==="timeline"&&<Timeline items={items} onCreate={()=>openCreate("milestone")} onOpen={setDetail}/>}
        {active==="files"&&<FileCheck items={missing} nameOf={nameOf} onMark={markFile} onOpen={setDetail}/>}
        {active==="data"&&<DataTools onExport={exportExcel} onImport={importExcel}/>}
        {!["dashboard","brief","categories","timeline","files","data"].includes(active)&&<Records title={pageTitle} items={filtered} loading={loading} nameOf={nameOf} onOpen={setDetail} onEdit={openEdit} onDelete={setDeleting}/>}
      </main>
    </SidebarInset>
    <Editor open={formOpen} onOpen={setFormOpen} form={form} setForm={setForm} editing={!!editing} projects={projects} buildings={buildings} categories={categories} contractors={items.filter(x=>x.kind==="contractor")} chooseParent={chooseParent} onSubmit={save}/>
    <Detail item={detail} open={!!detail} setOpen={o=>!o&&setDetail(null)} items={items} nameOf={nameOf} onEdit={openEdit} onDelete={setDeleting} onImage={setImage} onCreate={(kind,parent)=>{setDetail(null);setEditing(null);setForm({...emptyForm,kind,parentId:String(parent.id),projectId:String(parent.projectId||"")});setFormOpen(true)}}/>
    <ImageView item={image} close={()=>setImage(null)}/>
    <AlertDialog open={!!deleting} onOpenChange={o=>!o&&setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa “{deleting?.title}”?</AlertDialogTitle><AlertDialogDescription>Nội dung sẽ bị xóa khỏi WorkOS và hành động được ghi trong Nhật ký.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Giữ lại</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <Toaster richColors position="top-right"/>
  </SidebarProvider>;
}

function NavItem({id,label,Icon,active,setActive,badge=0}:{id:string;label:string;Icon:typeof Search;active:string;setActive:(v:string)=>void;badge?:number}){return <SidebarMenuItem><SidebarMenuButton isActive={active===id} onClick={()=>setActive(id)} className="nav-button"><Icon/><span>{label}</span>{badge>0&&<i>{badge}</i>}</SidebarMenuButton></SidebarMenuItem>}
function Dashboard({projects,categories,tasks,submissions,payments,attention,missing,nameOf,onOpen,onGoto,onQuick}:{projects:Item[];categories:Item[];tasks:Item[];submissions:Item[];payments:Item[];attention:Item[];missing:Item[];nameOf:(id:number|null)=>string;onOpen:(x:Item)=>void;onGoto:(s:string)=>void;onQuick:()=>void}){
  const follow=tasks.filter(x=>x.followUpDate&&x.followUpDate<=dateToday());const waiting=submissions.filter(x=>x.status!=="Hoàn tất");const paid=payments.reduce((s,x)=>s+x.paidAmount,0);
  return <><section className="hero-brief"><div><span className="eyebrow">BẢN TIN ĐIỀU HÀNH</span><h2>Chào buổi làm việc, Công nương.</h2><p>Hôm nay có <b>{attention.length} nội dung cần chú ý</b>, {follow.length} việc cần follow và {missing.length} hồ sơ cần kiểm tra.</p></div><div className="hero-actions"><Button onClick={onQuick} variant="secondary"><MessageSquareText/>Cập nhật sau họp</Button><Button onClick={()=>onGoto("brief")} className="rose-button">Đọc Daily Brief<ArrowRight/></Button></div></section>
    <section className="metrics"><Metric icon={BriefcaseBusiness} label="Dự án" value={projects.length} note="Toàn bộ danh mục"/><Metric icon={AlertTriangle} label="Hạng mục cần chú ý" value={attention.filter(x=>x.kind==="category").length} note="Nghẽn, rủi ro hoặc tới hạn" danger/><Metric icon={Clock3} label="Tờ trình đang chạy" value={waiting.length} note="Theo dõi người đang giữ"/><Metric icon={CircleDollarSign} label="Đã thanh toán" value={money(paid)} note="Tổng các đợt đã trả"/></section>
    <section className="dash-grid"><div className="panel"><PanelHead title="Ưu tiên số 1 hôm nay" subtitle="Xếp theo điểm nghẽn, deadline và ngày follow."/><div className="attention-list">{attention.slice(0,6).map((x,i)=><button key={x.id} onClick={()=>onOpen(x)} className="priority-row"><span className="priority-no">{String(i+1).padStart(2,"0")}</span><div><b>{x.title}</b><small>{kindLabel[x.kind]} · {nameOf(x.projectId||x.parentId)}</small></div><Health value={x.health}/><ArrowUpRight/></button>)}{!attention.length&&<Empty text="Chưa có nội dung khẩn cấp."/ >}</div></div>
      <div className="panel"><PanelHead title="Việc cần follow" subtitle="Ai đang nợ thông tin và bước tiếp theo."/><div className="compact-list">{[...follow,...waiting].slice(0,6).map(x=><button key={x.id} onClick={()=>onOpen(x)}><span className="avatar">{(x.followPerson||x.currentHolder||"?").slice(0,1)}</span><div><b>{x.title}</b><small>{x.followPerson||x.currentHolder||"Chưa xác định"} · {x.nextAction||"Chưa có next action"}</small></div><time>{x.followUpDate||holding(x.holdingSince)+" ngày"}</time></button>)}{!follow.length&&!waiting.length&&<Empty text="Không có việc cần follow."/ >}</div></div></section>
    <section className="panel"><PanelHead title="Danh mục dự án" subtitle="Bấm dự án để xem công trình và hạng mục liên quan." action={<Button size="sm" variant="outline" onClick={()=>onGoto("projects")}>Xem tất cả</Button>}/><div className="project-strip">{projects.slice(0,5).map(x=><button key={x.id} onClick={()=>onOpen(x)} className="project-card"><div className="project-crown"><Crown/></div><span>{x.company||"ALMIRA"}</span><h3>{x.title}</h3><div className="progress-track"><i style={{width:x.progress+"%"}}/></div><footer><Health value={x.health}/><b>{x.progress}%</b></footer></button>)}{!projects.length&&<Empty text="Tạo dự án đầu tiên để bắt đầu."/ >}</div></section></>;
}
function DailyBrief({attention,submissions,payments,onOpen}:{attention:Item[];submissions:Item[];payments:Item[];onOpen:(x:Item)=>void}){return <section className="brief-page"><div className="brief-cover"><Crown/><span>DAILY BRIEF · {new Date().toLocaleDateString("vi-VN")}</span><h2>30 giây để nắm toàn bộ công việc.</h2><p>{attention.length?"Có "+attention.length+" nội dung cần chú ý. Ưu tiên các hạng mục nghẽn và hồ sơ tới ngày follow.":"Hôm nay chưa có nội dung khẩn cấp. Hãy rà soát timeline và cập nhật tiến độ."}</p></div><div className="brief-grid"><BriefBlock title="Hạng mục nghẽn & sắp trễ" icon={AlertTriangle} items={attention.filter(x=>x.kind==="category")} onOpen={onOpen}/><BriefBlock title="Quyết định đang chờ" icon={UserRoundCog} items={attention.filter(x=>x.status.includes("chờ")||x.nextAction.toLowerCase().includes("bod"))} onOpen={onOpen}/><BriefBlock title="Tờ trình cần theo" icon={FileText} items={submissions.filter(x=>x.status!=="Hoàn tất")} onOpen={onOpen}/><BriefBlock title="Thanh toán sắp tới" icon={CircleDollarSign} items={payments.filter(x=>x.status!=="Hoàn tất")} onOpen={onOpen}/><div className="brief-quote"><Sparkles/><p>Thông tin không bắt bạn đi tìm. Những điểm nghẽn quan trọng nhất sẽ tự chạy tới đây.</p><small>WorkOS Intelligence</small></div></div></section>}
function BriefBlock({title,icon:Icon,items,onOpen}:{title:string;icon:typeof Search;items:Item[];onOpen:(x:Item)=>void}){return <div className="brief-block"><header><Icon/><h3>{title}</h3><span>{items.length}</span></header>{items.slice(0,4).map(x=><button onClick={()=>onOpen(x)} key={x.id}><div><b>{x.title}</b><small>{x.nextAction||x.currentHolder||x.status}</small></div><ArrowRight/></button>)}{!items.length&&<Empty text="Không có nội dung."/ >}</div>}
function Board({items,loading,onOpen,onEdit}:{items:Item[];loading:boolean;onOpen:(x:Item)=>void;onEdit:(x:Item)=>void}){const groups=["Đang bị nghẽn","Có rủi ro","Đúng tiến độ","Tạm dừng"];if(loading)return <Empty text="Đang tải..."/>;return <section className="kanban">{groups.map(g=><div className="kanban-column" key={g}><header><Health value={g}/><span>{items.filter(x=>x.health===g).length}</span></header>{items.filter(x=>x.health===g).map(x=><article className="kanban-card" key={x.id}><button className="card-main" onClick={()=>onOpen(x)}><span>{x.code||x.lifecycle}</span><h3>{x.title}</h3><p>{x.nextAction||x.description||"Chưa có next action"}</p><div className="progress-track"><i style={{width:x.progress+"%"}}/></div><footer><small>{x.company||"Chưa chọn công ty"}</small><b>{x.progress}%</b></footer></button><Button variant="ghost" size="icon-sm" onClick={()=>onEdit(x)}><Pencil/></Button></article>)}{!items.some(x=>x.health===g)&&<Empty text="Trống"/>}</div>)}</section>}
function Timeline({items,onCreate,onOpen}:{items:Item[];onCreate:()=>void;onOpen:(x:Item)=>void}){const dated=items.filter(x=>x.dueDate||x.followUpDate||x.startDate).sort((a,b)=>String(a.dueDate||a.followUpDate||a.startDate).localeCompare(String(b.dueDate||b.followUpDate||b.startDate)));return <section className="panel"><PanelHead title="Timeline tổng" subtitle="Tự gom deadline, ngày follow và mốc thủ công." action={<Button onClick={onCreate} className="rose-button"><Plus/>Mốc</Button>}/><div className="timeline">{dated.map(x=><button key={x.id} onClick={()=>onOpen(x)}><time>{new Date(x.dueDate||x.followUpDate||x.startDate||"").toLocaleDateString("vi-VN",{day:"2-digit",month:"short"})}</time><i/><div><b>{x.title}</b><small>{kindLabel[x.kind]} · {x.nextAction||x.status}</small></div><span className={(remaining(x.dueDate||x.followUpDate)||0)<0?"overdue":""}>{remaining(x.dueDate||x.followUpDate)} ngày</span></button>)}{!dated.length&&<Empty text="Chưa có mốc thời gian."/>}</div></section>}
function FileCheck({items,nameOf,onMark,onOpen}:{items:Item[];nameOf:(id:number|null)=>string;onMark:(x:Item)=>void;onOpen:(x:Item)=>void}){return <section className="panel"><PanelHead title="Hồ sơ cần kiểm tra" subtitle="Chưa lưu file, link sai hoặc hồ sơ chưa đúng phiên bản."/><div className="file-table">{items.map(x=><article key={x.id}><button onClick={()=>onOpen(x)}><FileText/><div><b>{x.title}</b><small>{kindLabel[x.kind]} · {nameOf(x.projectId||x.parentId)}</small></div></button><p>{x.fileStorageNote||"Chưa xác nhận file đúng"}</p>{x.fileUrl?<a href={x.fileUrl} target="_blank" rel="noreferrer">Mở link<ArrowUpRight/></a>:<span>Chưa có link</span>}<Button size="sm" onClick={()=>onMark(x)}>Xác nhận đã lưu</Button></article>)}{!items.length&&<Empty text="Tất cả hồ sơ đã được xác nhận."/ >}</div></section>}
function DataTools({onExport,onImport}:{onExport:()=>void;onImport:(e:ChangeEvent<HTMLInputElement>)=>void}){return <section className="data-grid"><div className="data-card"><div><Download/><span>BACKUP</span></div><h2>Xuất backup Excel</h2><p>Tải dự án, hạng mục, task, tờ trình, thanh toán, nhà thầu và nhật ký thành nhiều sheet.</p><Button onClick={onExport} className="rose-button"><FileSpreadsheet/>Xuất backup</Button></div><div className="data-card"><div><Upload/><span>IMPORT</span></div><h2>Nhập tờ trình từ Excel</h2><p>Đọc sheet đầu tiên với các cột Tên tờ trình, Trạng thái và Đang ở đâu.</p><label className="upload-button"><FileSpreadsheet/>Chọn file Excel<Input type="file" accept=".xlsx,.xls,.csv" onChange={onImport}/></label></div></section>}
function Records({title,items,loading,nameOf,onOpen,onEdit,onDelete}:{title:string;items:Item[];loading:boolean;nameOf:(id:number|null)=>string;onOpen:(x:Item)=>void;onEdit:(x:Item)=>void;onDelete:(x:Item)=>void}){return <section className="panel"><PanelHead title={title} subtitle="Nhập một nơi, dữ liệu tự xuất hiện ở các góc nhìn liên quan."/><div className="records">{loading?<Empty text="Đang tải..."/>:items.map(x=><article key={x.id}><button className="record-main" onClick={()=>onOpen(x)}><div className="record-icon">{iconFor(x.kind)}</div><div><div className="record-tags"><span>{kindLabel[x.kind]}</span>{x.code&&<i>{x.code}</i>}<Health value={x.health}/></div><h3>{x.title}</h3><p>{subtitleFor(x,nameOf)}</p></div></button>{x.imagePath&&<button className="mini-drawing" onClick={()=>onOpen(x)}><ImageIcon/><span>{x.imageTitle||"Bản vẽ"}</span></button>}<div className="record-actions"><Button variant="ghost" size="icon-sm" onClick={()=>onEdit(x)}><Pencil/></Button><Button variant="ghost" size="icon-sm" onClick={()=>onDelete(x)}><Trash2/></Button></div></article>)}{!loading&&!items.length&&<Empty text="Chưa có dữ liệu."/ >}</div></section>}

function Detail({item,open,setOpen,items,nameOf,onEdit,onDelete,onImage,onCreate}:{item:Item|null;open:boolean;setOpen:(o:boolean)=>void;items:Item[];nameOf:(id:number|null)=>string;onEdit:(x:Item)=>void;onDelete:(x:Item)=>void;onImage:(x:Item)=>void;onCreate:(k:Kind,p:Item)=>void}){if(!item)return null;const linked=items.filter(x=>x.parentId===item.id||(item.kind==="project"&&x.projectId===item.id));const workflows=linked.filter(x=>x.kind==="workflow");return <Sheet open={open} onOpenChange={setOpen}><SheetContent className="detail-sheet overflow-y-auto sm:max-w-2xl"><SheetHeader><div className="detail-kicker">{kindLabel[item.kind]} · {item.code||"WORKOS"}</div><SheetTitle className="detail-title">{item.title}</SheetTitle><SheetDescription>{item.description||"Chưa có mô tả."}</SheetDescription></SheetHeader><div className="detail-actions"><Button onClick={()=>onEdit(item)}><Pencil/>Sửa</Button><Button variant="outline" onClick={()=>onDelete(item)}><Trash2/>Xóa</Button></div><div className="detail-stats"><Stat label="Sức khỏe"><Health value={item.health}/></Stat><Stat label="Tiến độ"><b>{item.progress}%</b></Stat><Stat label="Còn lại"><b>{remaining(item.dueDate)==null?"—":remaining(item.dueDate)+" ngày"}</b></Stat><Stat label="Đơn vị"><b>{item.company||"—"}</b></Stat></div>{item.nextAction&&<div className="next-action"><Sparkles/><div><span>NEXT ACTION</span><b>{item.nextAction}</b></div></div>}{item.kind==="submission"&&<div className="holder-card"><Clock3/><div><span>ĐANG Ở / CHỜ AI</span><b>{item.currentHolder||"Chưa phân"}</b><small>Đã nằm {holding(item.holdingSince)} ngày</small></div></div>}{item.imagePath&&<button className="drawing-block" onClick={()=>onImage(item)}>{/^https?:\/\//.test(item.imagePath)?<img src={item.imagePath} alt={item.imageTitle||item.title}/>:<ImageIcon/>}<div><b>{item.imageTitle||"Hình ảnh / bản vẽ"}</b><span>Bấm để mở và xem chi tiết</span></div></button>}<div className="doc-block"><header><Link2/><b>Hồ sơ liên kết</b></header><p>{item.fileName||"Chưa đặt tên hồ sơ"}</p>{item.fileUrl?<a href={item.fileUrl} target="_blank" rel="noreferrer">Mở file<ArrowUpRight/></a>:<span>Chưa có link</span>}<FileBadge state={item.fileStorageStatus}/></div>{item.kind==="category"&&<><SectionTitle title="Workflow hạng mục" action={<Button size="sm" onClick={()=>onCreate("workflow",item)}><Plus/>Bước</Button>}/><div className="workflow">{workflows.map((x,i)=><div key={x.id}><i>{i+1}</i><div><b>{x.title}</b><span>{x.status}{x.skippedReason?" · "+x.skippedReason:""}</span></div>{x.status==="Skip"&&!x.skipApproved&&<em>Cần xác nhận</em>}</div>)}{!workflows.length&&<Empty text="Chưa thiết lập quy trình."/>}</div></>}<SectionTitle title="Nội dung liên quan" action={item.kind==="category"?<Button size="sm" variant="outline" onClick={()=>onCreate("task",item)}><Plus/>Task</Button>:undefined}/><div className="linked-grid">{linked.filter(x=>x.kind!=="workflow"&&x.kind!=="log").map(x=><button key={x.id}><span>{kindLabel[x.kind]}</span><b>{x.title}</b><small>{x.currentHolder||x.owner||x.status}</small></button>)}{!linked.filter(x=>x.kind!=="workflow"&&x.kind!=="log").length&&<Empty text="Chưa có nội dung liên kết."/>}</div><SectionTitle title="Nhật ký thay đổi"/><div className="log-list">{items.filter(x=>x.kind==="log"&&(x.parentId===item.id||x.projectId===item.id)).slice(0,8).map(x=><div key={x.id}><History/><div><b>{x.title}</b><span>{x.description||new Date(x.createdAt).toLocaleString("vi-VN")}</span></div></div>)}{!items.some(x=>x.kind==="log"&&(x.parentId===item.id||x.projectId===item.id))&&<Empty text="Chưa có nhật ký."/>}</div></SheetContent></Sheet>}

function Editor({open,onOpen,form,setForm,editing,projects,buildings,categories,contractors,chooseParent,onSubmit}:{open:boolean;onOpen:(o:boolean)=>void;form:typeof emptyForm;setForm:React.Dispatch<React.SetStateAction<typeof emptyForm>>;editing:boolean;projects:Item[];buildings:Item[];categories:Item[];contractors:Item[];chooseParent:(id:string)=>void;onSubmit:(e:FormEvent)=>void}){
  const hierarchy=form.kind!=="project"&&form.kind!=="contractor";const media=["category","task","submission"].includes(form.kind);
  return <Dialog open={open} onOpenChange={onOpen}><DialogContent className="editor max-h-[94vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{editing?"Cập nhật ":"Tạo mới "}{kindLabel[form.kind]}</DialogTitle><DialogDescription>Dữ liệu liên kết tự xuất hiện ở Dashboard, Timeline và Chi tiết Hạng mục.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="editor-form">
    <div className="form-grid three"><Field label="Loại"><select className="control" value={form.kind} onChange={e=>setForm({...emptyForm,kind:e.target.value as Kind})}>{Object.entries(kindLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field><Field label="Mã"><Input value={form.code} onChange={e=>setForm(v=>({...v,code:e.target.value}))}/></Field><Field label="Trạng thái"><select className="control" value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))}><option>Đang thực hiện</option><option>Đang chờ</option><option>Đang xử lý</option><option>Hoàn tất</option><option>Skip</option><option>Tạm dừng</option></select></Field></div>
    <Field label="Tên nội dung *"><Input required value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))}/></Field>
    {hierarchy&&<div className="form-grid"><Field label="Dự án"><select className="control" value={form.projectId} onChange={e=>setForm(v=>({...v,projectId:e.target.value}))}><option value="">Chọn dự án</option>{projects.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>{form.kind!=="building"&&<Field label={form.kind==="category"?"Công trình":"Hạng mục"}><select className="control" value={form.parentId} onChange={e=>chooseParent(e.target.value)}><option value="">Chọn liên kết</option>{(form.kind==="category"?buildings:categories).map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>}</div>}
    <Field label="Mô tả / cập nhật gần nhất"><Textarea value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))}/></Field>
    <div className="form-grid three"><Field label="Sức khỏe"><select className="control" value={form.health} onChange={e=>setForm(v=>({...v,health:e.target.value}))}><option>Đúng tiến độ</option><option>Có rủi ro</option><option>Đang bị nghẽn</option><option>Chậm tiến độ</option><option>Tạm dừng</option></select></Field><Field label="Mức chốt"><select className="control" value={form.lifecycle} onChange={e=>setForm(v=>({...v,lifecycle:e.target.value}))}><option>Dự kiến</option><option>Chờ chốt</option><option>Đã chốt</option></select></Field><Field label="Giai đoạn"><Input value={form.phase} onChange={e=>setForm(v=>({...v,phase:e.target.value}))} placeholder="Thiết kế, đấu thầu..."/></Field></div>
    <div className="form-grid three"><Field label="PIC / Phụ trách"><Input value={form.owner} onChange={e=>setForm(v=>({...v,owner:e.target.value}))}/></Field><Field label="Người cần follow"><Input value={form.followPerson} onChange={e=>setForm(v=>({...v,followPerson:e.target.value}))}/></Field><Field label="Công ty / Nhà thầu"><Input list="contractors" value={form.company} onChange={e=>setForm(v=>({...v,company:e.target.value}))}/><datalist id="contractors">{contractors.map(x=><option key={x.id} value={x.title}/>)}</datalist></Field></div>
    <div className="form-grid three"><Field label="Ngày bắt đầu"><Input type="date" value={form.startDate} onChange={e=>setForm(v=>({...v,startDate:e.target.value}))}/></Field><Field label="Deadline / Follow-up"><Input type="date" value={form.kind==="task"||form.kind==="submission"?form.followUpDate:form.dueDate} onChange={e=>setForm(v=>form.kind==="task"||form.kind==="submission"?({...v,followUpDate:e.target.value}):({...v,dueDate:e.target.value}))}/></Field><Field label="Tiến độ %"><Input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm(v=>({...v,progress:e.target.value}))}/></Field></div>
    <Field label="Next action"><Input value={form.nextAction} onChange={e=>setForm(v=>({...v,nextAction:e.target.value}))} placeholder="Bước tiếp theo rõ nhất"/></Field>
    {form.kind==="submission"&&<div className="form-grid"><Field label="Đang ở đâu / chờ ai"><Input value={form.currentHolder} onChange={e=>setForm(v=>({...v,currentHolder:e.target.value,holdingSince:v.holdingSince||dateToday()}))}/></Field><Field label="Giữ từ ngày"><Input type="date" value={form.holdingSince} onChange={e=>setForm(v=>({...v,holdingSince:e.target.value}))}/></Field></div>}
    {form.kind==="payment"&&<div className="form-section"><div className="section-title"><CircleDollarSign/>Thông tin thanh toán</div><div className="form-grid three"><Field label="Đợt"><Input value={form.paymentRound} onChange={e=>setForm(v=>({...v,paymentRound:e.target.value}))}/></Field><Field label="Đề nghị"><Input type="number" value={form.amount} onChange={e=>setForm(v=>({...v,amount:e.target.value}))}/></Field><Field label="Đã thanh toán"><Input type="number" value={form.paidAmount} onChange={e=>setForm(v=>({...v,paidAmount:e.target.value}))}/></Field></div><Field label="% khối lượng"><Input type="number" min="0" max="100" value={form.quantityProgress} onChange={e=>setForm(v=>({...v,quantityProgress:e.target.value}))}/></Field></div>}
    {form.kind==="contractor"&&<div className="form-grid"><Field label="Người liên hệ"><Input value={form.followPerson} onChange={e=>setForm(v=>({...v,followPerson:e.target.value}))}/></Field><Field label="Giá trị hợp đồng"><Input type="number" value={form.contractValue} onChange={e=>setForm(v=>({...v,contractValue:e.target.value}))}/></Field></div>}
    {form.status==="Skip"&&<div className="skip-box"><AlertTriangle/><Field label="Lý do bỏ qua bước *"><Input required value={form.skippedReason} onChange={e=>setForm(v=>({...v,skippedReason:e.target.value}))}/></Field><label><input type="checkbox" checked={form.skipApproved} onChange={e=>setForm(v=>({...v,skipApproved:e.target.checked}))}/>Đã được phê duyệt, không cần cảnh báo nữa</label></div>}
    {media&&<><div className="form-section"><div className="section-title"><ImageIcon/>Hình ảnh / bản vẽ</div><div className="form-grid"><Field label="Tên bản vẽ"><Input value={form.imageTitle} onChange={e=>setForm(v=>({...v,imageTitle:e.target.value}))}/></Field><Field label="Đường dẫn ảnh"><Input value={form.imagePath} onChange={e=>setForm(v=>({...v,imagePath:e.target.value}))} placeholder="URL nội bộ hoặc OneDrive"/></Field></div><small>Chỉ lưu đường dẫn, không tải ảnh lên WorkOS.</small></div><div className="form-section"><div className="section-title"><Link2/>Hồ sơ liên kết</div><div className="form-grid"><Field label="Tên file"><Input value={form.fileName} onChange={e=>setForm(v=>({...v,fileName:e.target.value}))}/></Field><Field label="Link file"><Input value={form.fileUrl} onChange={e=>setForm(v=>({...v,fileUrl:e.target.value}))}/></Field></div><RadioGroup value={form.fileStorageStatus} onValueChange={v=>setForm(x=>({...x,fileStorageStatus:v as FileState}))} className="form-grid"><label className="radio-card"><RadioGroupItem value="SAVED_ONEDRIVE"/><span><b>Đã lưu file OneDrive</b><small>Đúng vị trí và mở được</small></span></label><label className="radio-card warning"><RadioGroupItem value="MISSING_OR_INCORRECT"/><span><b>Chưa lưu file / Lưu sai</b><small>Cần kiểm tra lại</small></span></label></RadioGroup>{form.fileStorageStatus==="MISSING_OR_INCORRECT"&&<Field label="Ghi chú lỗi"><Input value={form.fileStorageNote} onChange={e=>setForm(v=>({...v,fileStorageNote:e.target.value}))}/></Field>}</div></>}
    <DialogFooter><Button type="button" variant="outline" onClick={()=>onOpen(false)}>Hủy</Button><Button className="rose-button" type="submit">Lưu vào WorkOS</Button></DialogFooter>
  </form></DialogContent></Dialog>
}

function ImageView({item,close}:{item:Item|null;close:()=>void}){return <Dialog open={!!item} onOpenChange={o=>!o&&close()}><DialogContent className="image-modal sm:max-w-6xl"><DialogHeader><DialogTitle>{item?.imageTitle||item?.title}</DialogTitle><DialogDescription>Bản vẽ giữ nguyên tỷ lệ. Mở ảnh gốc để phóng to thêm.</DialogDescription></DialogHeader>{item?.imagePath&&<div className="image-stage"><img src={item.imagePath} alt={item.imageTitle||item.title}/></div>}{item?.imagePath&&<DialogFooter><Button asChild><a href={item.imagePath} target="_blank" rel="noreferrer">Mở ảnh gốc<ArrowUpRight/></a></Button></DialogFooter>}</DialogContent></Dialog>}
function PanelHead({title,subtitle,action}:{title:string;subtitle:string;action?:React.ReactNode}){return <header className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</header>}
function Metric({icon:Icon,label,value,note,danger=false}:{icon:typeof Search;label:string;value:string|number;note:string;danger?:boolean}){return <div className={"metric "+(danger?"danger":"")}><div><Icon/></div><span>{label}</span><b>{value}</b><small>{note}</small></div>}
function Health({value}:{value:string}){const cls=value.includes("nghẽn")||value.includes("Chậm")?"bad":value.includes("rủi ro")?"warn":value.includes("Đúng")?"good":"neutral";return <span className={"health "+cls}><i/>{value}</span>}
function FileBadge({state}:{state:FileState}){return <span className={"file-badge "+(state==="SAVED_ONEDRIVE"?"saved":"missing")}>{state==="SAVED_ONEDRIVE"?<CheckCircle2/>:<XCircle/>}{state==="SAVED_ONEDRIVE"?"Đã lưu OneDrive":"Chưa lưu / lưu sai"}</span>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function Stat({label,children}:{label:string;children:React.ReactNode}){return <div><span>{label}</span>{children}</div>}
function SectionTitle({title,action}:{title:string;action?:React.ReactNode}){return <div className="section-heading"><h3>{title}</h3>{action}</div>}
function Empty({text}:{text:string}){return <div className="empty"><ClipboardList/><span>{text}</span></div>}
function subtitleFor(x:Item,nameOf:(id:number|null)=>string){if(x.kind==="submission")return "Đang ở: "+(x.currentHolder||"Chưa phân")+" · nằm "+holding(x.holdingSince)+" ngày";if(x.kind==="payment")return (x.paymentRound||"Đợt thanh toán")+" · "+money(x.amount)+" · đã trả "+money(x.paidAmount);if(x.kind==="contractor")return (x.followPerson||"Chưa có liên hệ")+" · Hợp đồng "+money(x.contractValue);return nameOf(x.projectId||x.parentId)+" · "+(x.nextAction||x.status)}
function iconFor(k:Kind){const map:Record<Kind,React.ReactNode>={project:<BriefcaseBusiness/>,building:<Building2/>,category:<FolderKanban/>,task:<ListChecks/>,submission:<FileText/>,contractor:<UsersRound/>,payment:<CircleDollarSign/>,milestone:<CalendarDays/>,log:<History/>,workflow:<ArrowRight/>};return map[k]}
