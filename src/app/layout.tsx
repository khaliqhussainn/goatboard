import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SplashScreen } from "@/components/layout/splash-screen";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const PAGE_PULSE_TRACKING_SCRIPT = String.raw`
(function(){
  if(window.self!==window.top)return;
  var pid="a477c97b-4cb2-4e6c-87b3-d2dc3ab21e59";
  var tk="3d272eb8-caf0-4e0b-915a-7f9b0185e872";
  var ep="https://esnubozrjxrbegatzusu.supabase.co/functions/v1/track";
  var sid=sessionStorage.getItem("_pp_sid")||Math.random().toString(36).slice(2);
  sessionStorage.setItem("_pp_sid",sid);
  var vid=localStorage.getItem("_pp_vid")||Math.random().toString(36).slice(2);
  localStorage.setItem("_pp_vid",vid);
  var lastUrl=location.href;
  function send(t,n){
    fetch(ep,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({page_id:pid,token:tk,url:location.href,referrer:document.referrer,
        user_agent:navigator.userAgent,screen_width:screen.width,
        session_id:sid,visitor_id:vid,event_type:t,element_name:n||null})});
  }
  send("pageview");
  document.addEventListener("click",function(e){
    var el=e.target.closest("a,button,[role='button'],input[type='submit']");
    if(!el)return;
    var p=el;while(p){var s=getComputedStyle(p);if(s.position==="fixed"||s.position==="sticky"){var r=p.getBoundingClientRect();if(r.width>window.innerWidth*0.4&&r.height>window.innerHeight*0.3)return;}p=p.parentElement;}
    var name=el.getAttribute("data-pp")||el.innerText||el.getAttribute("aria-label")||el.tagName;
    if(name)send("click",name.trim().substring(0,100));
  });
  function checkUrl(){if(location.href!==lastUrl){lastUrl=location.href;send("pageview");}}
  var origPush=history.pushState;history.pushState=function(){origPush.apply(this,arguments);checkUrl();};
  var origReplace=history.replaceState;history.replaceState=function(){origReplace.apply(this,arguments);checkUrl();};
  window.addEventListener("popstate",checkUrl);
  setInterval(function(){if(!document.hidden)send("ping");},15000);
  var _cc={};
  function trackConversion(label){var k=label||"_";if(_cc[k])return;_cc[k]=1;send("conversion",label||null);}
  window.PagePulse=window.PagePulse||{};
  window.PagePulse.trackConversion=trackConversion;
  window.pagePulse=window.PagePulse;
  /* Web Vitals: LCP, CLS, INP, page load time */
  var _v={cls:0,inp:0};
  try{
    if(window.PerformanceObserver){
      try{new PerformanceObserver(function(l){var e=l.getEntries();if(e.length)_v.lcp=Math.round(e[e.length-1].startTime);}).observe({type:"largest-contentful-paint",buffered:true});}catch(e){}
      try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput)_v.cls+=e.value;});}).observe({type:"layout-shift",buffered:true});}catch(e){}
      try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.duration>_v.inp)_v.inp=Math.round(e.duration);});}).observe({type:"event",buffered:true,durationThreshold:40});}catch(e){}
    }
  }catch(e){}
  function flushVitals(){
    if(_v._sent)return;_v._sent=1;
    try{var nt=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(nt&&nt.loadEventEnd)_v.load=Math.round(nt.loadEventEnd);}catch(e){}
    var dt=(screen.width&&screen.width<768)?"mobile":"desktop";
    var payload={page_id:pid,token:tk,url:location.href,session_id:sid,event_type:"vitals",vitals:{lcp:_v.lcp||null,cls:_v.cls?Math.round(_v.cls*1000)/1000:null,inp:_v.inp||null,load_time:_v.load||null,device_type:dt}};
    try{if(navigator.sendBeacon){navigator.sendBeacon(ep,new Blob([JSON.stringify(payload)],{type:"application/json"}));}else{fetch(ep,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});}}catch(e){}
  }
  addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flushVitals();});
  addEventListener("pagehide",flushVitals);
})();`;

/**
 * The share card every page falls back to, served straight out of public/
 * rather than composed at request time. The relative path is resolved against
 * metadataBase into the absolute URL scrapers require.
 *
 * 1200x630 (1.91:1) because that is the ratio every platform's card is built
 * around - X in particular will not render a summary_large_image far outside
 * it, which is why the 2.69:1 source artwork (public/goatboard.png) could not
 * be used directly. The card keeps that artwork whole and extends its edge
 * colours into the bands instead of cropping it.
 *
 * Campaign pages override this with their own opengraph-image route.
 */
const SHARE_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 628,
  // JPEG, not PNG: the same card as a PNG is 503KB, and WhatsApp drops the
  // preview entirely somewhere above ~300KB. At q90 this is 135KB and the
  // difference is invisible at card size.
  type: "image/jpeg",
  alt: "GOATBOARD - get VOAT to become a GOAT. The billboard for startups.",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Goatboard",
    template: "%s · Goatboard",
  },
  description:
    "GOATBOARD is a public competitive billboard. Vote or boost anything - products, startups, ideas, memes - to the #1 spot. There's only one spotlight. Who's the GOAT?",
  openGraph: {
    title: "GoatBoard - Get VOAT to become a GOAT",
    description: "The billboard for startups.",
    siteName: "GoatBoard",
    type: "website",
    // Relative, so metadataBase resolves it to the production origin rather
    // than whichever host happened to render the page.
    url: "/",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoatBoard - Get VOAT to become a GOAT",
    description: "The billboard for startups.",
    images: [SHARE_IMAGE],
  },
};

export default function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & { modal: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SplashScreen />
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {modal}
        <Toaster position="bottom-center" richColors closeButton />
        <Script id="page-pulse-tracking" strategy="afterInteractive">
          {PAGE_PULSE_TRACKING_SCRIPT}
        </Script>
        {/* Last resort for the splash. Inline, so it runs even if the app
            bundle never loads - in which case hydration never happens and
            SplashReady would never clear it. Eight seconds is far past a
            normal hydration, so this only ever fires when something broke. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "setTimeout(function(){document.documentElement.classList.add('app-ready')},8000)",
          }}
        />
      </body>
    </html>
  );
}
