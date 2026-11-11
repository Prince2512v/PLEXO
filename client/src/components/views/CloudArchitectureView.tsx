import React, { useState } from 'react';

export const CloudArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'stack'>('pipeline');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditPassed, setAuditPassed] = useState(false);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditPassed(true);
      setTimeout(() => setAuditPassed(false), 3000);
    }, 1200);
  };

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col w-full gap-8">

<section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 bg-surface-container-lowest rounded-3xl shadow-sm">
<div className="flex flex-col gap-2 max-w-2xl">
<div className="flex items-center gap-3">
<span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider">PLEXO System Reference v3.4</span>
<span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
<span className="w-2 h-2 rounded-full bg-secondary"></span> Tier-1 Distributed Spec
        </span>
</div>
<h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">System Architecture &amp; Cloud Models</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant">
        Rigorous engineering manual covering multi-tiered OSI load balancing, mathematical workload routing algorithms, elastic pooling policies, and zero-trust perimeter defense.
      </p>
</div>

<div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-surface-container-low p-4 rounded-2xl">
<div className="flex flex-col px-4 py-2 bg-surface-container-lowest rounded-xl shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Proxy Path Latency</span>
<span className="font-headline-sm text-headline-sm text-primary-container font-bold tracking-tight">0.84 ms</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">L4-to-L7 Pipeline</span>
</div>
<div className="flex flex-col px-4 py-2 bg-surface-container-lowest rounded-xl shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Mesh Nodes</span>
<span className="font-headline-sm text-headline-sm text-primary-container font-bold tracking-tight">1,024</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">100% In-Sync</span>
</div>
<div className="flex flex-col px-4 py-2 bg-surface-container-lowest rounded-xl shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Ingress Policy</span>
<span className="font-headline-sm text-headline-sm text-primary-container font-bold tracking-tight">TLS 1.3</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">Strict mTLS Enforced</span>
</div>
</div>
</section>

<section className="flex flex-col gap-6">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="material-symbols-outlined text-secondary text-[20px]">layers</span>
<span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">Pipeline Topography</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Architectural Flow &amp; Load Balancing Layers</h2>
</div>
<div className="flex items-center gap-2 bg-surface-container-high p-1.5 rounded-full">
<button 
  onClick={() => setActiveTab('pipeline')}
  className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-all ${
    activeTab === 'pipeline' 
      ? 'bg-primary-container text-on-primary shadow-sm' 
      : 'text-on-surface-variant hover:text-on-surface'
  }`} 
  id="view-pipeline-btn">
  Pipeline Graph
</button>
<button 
  onClick={() => setActiveTab('stack')}
  className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-all ${
    activeTab === 'stack' 
      ? 'bg-primary-container text-on-primary shadow-sm' 
      : 'text-on-surface-variant hover:text-on-surface'
  }`} 
  id="view-stack-btn">
  Protocol Inspection
</button>
</div>
</div>

<div className="p-6 md:p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col gap-8">
<div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 relative">

<div className="flex-1 p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between mb-4">
<span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Tier 0</span>
<span className="material-symbols-outlined text-secondary text-[24px]">public</span>
</div>
<div>
<h3 className="font-title-md text-title-md text-on-surface font-bold">Client Request Layer</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Global distributed ingress via Edge DNS &amp; BGP Anycast routing to nearest regional POP.</p>
</div>
<div className="mt-4 pt-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">BGP Geo-Proximity</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">12ms TTFB</span>
</div>
</div>

<div className="hidden lg:flex items-center justify-center text-outline-variant">
<span className="material-symbols-outlined text-[28px] text-secondary">arrow_forward</span>
</div>

<div className="flex-1 p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between mb-4">
<span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Tier 1 • L4</span>
<span className="material-symbols-outlined text-secondary text-[24px]">swap_calls</span>
</div>
<div>
<h3 className="font-title-md text-title-md text-on-surface font-bold">L4 Transport Balancer</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">High-throughput kernel-space packet dispatch (eBPF / Maglev). Operates on IP 5-tuple.</p>
</div>
<div className="mt-4 pt-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Throughput</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">40 Gbps / core</span>
</div>
</div>

<div className="hidden lg:flex items-center justify-center text-outline-variant">
<span className="material-symbols-outlined text-[28px] text-secondary">arrow_forward</span>
</div>

<div className="flex-1 p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between mb-4">
<span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Tier 2 • L7</span>
<span className="material-symbols-outlined text-secondary text-[24px]">alt_route</span>
</div>
<div>
<h3 className="font-title-md text-title-md text-on-surface font-bold">L7 Reverse Proxy</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Envoy/PLEXO core for HTTP/2 demuxing, SSL termination, path-based routing, and JWT validation.</p>
</div>
<div className="mt-4 pt-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Header Processing</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">&lt; 0.2ms</span>
</div>
</div>

<div className="hidden lg:flex items-center justify-center text-outline-variant">
<span className="material-symbols-outlined text-[28px] text-secondary">arrow_forward</span>
</div>

<div className="flex-1 p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between mb-4">
<span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">Target</span>
<span className="material-symbols-outlined text-secondary text-[24px]">dns</span>
</div>
<div>
<h3 className="font-title-md text-title-md text-on-surface font-bold">Pod Worker Fleet</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Autonomous containerized nodes (Node 1..N) servicing isolated microservices over Unix sockets.</p>
</div>
<div className="mt-4 pt-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Healthy Pods</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">99.98% Available</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

<div className="p-6 rounded-2xl bg-surface-container-low flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">speed</span>
</div>
<div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Layer 4: Transport Load Balancer</h4>
<span className="font-label-sm text-label-sm text-on-surface-variant">Stateless • Low Latency • High Scale</span>
</div>
</div>
<span className="px-3 py-1 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-secondary font-bold shadow-sm">TCP / UDP</span>
</div>
<div className="flex flex-col gap-2.5 pt-2">
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-semibold text-primary">Zero Payload Decryption:</span> Distributes purely on client IP, client port, server IP, server port, and protocol 5-tuple without TLS overhead.</p>
</div>
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-semibold text-primary">Ultra-Low Overhead:</span> Operates inside host kernel bypassing user-space memory copies, reaching sub-microsecond packet transit.</p>
</div>
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-semibold text-primary">DDoS Absorption:</span> Functions as the line-rate first defense against SYN floods and amplification attacks before application buffers.</p>
</div>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Optimal Use Case</span>
<span className="font-label-sm text-label-sm text-primary font-bold">Real-time gaming, VoIP, raw TCP databases, massive ingress streams</span>
</div>
</div>

<div className="p-6 rounded-2xl bg-surface-container-low flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">smart_toy</span>
</div>
<div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Layer 7: Application Load Balancer</h4>
<span className="font-label-sm text-label-sm text-on-surface-variant">Context-Aware • Path Routing • Header Parsing</span>
</div>
</div>
<span className="px-3 py-1 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-secondary font-bold shadow-sm">HTTP/2, gRPC, WS</span>
</div>
<div className="flex flex-col gap-2.5 pt-2">
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-semibold text-primary">Content-Based Routing:</span> Routes requests dynamically based on URI paths (<code className="bg-surface-container px-1 py-0.5 rounded text-secondary font-semibold">/api/v2/orders</code>), HTTP headers, or method types.</p>
</div>
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-semibold text-primary">SSL Offloading &amp; Termination:</span> Manages crypto handshakes and certificate renewal centrally, forwarding plain HTTP to protected pods.</p>
</div>
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-semibold text-primary">Sticky Sessions &amp; Auth:</span> Supports cookie affinity for legacy stateful services, inline token parsing, and gzip/brotli compression.</p>
</div>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Optimal Use Case</span>
<span className="font-label-sm text-label-sm text-primary font-bold">RESTful Microservices, GraphQL federation, WebSockets, A/B canary routing</span>
</div>
</div>
</div>
</div>
</section>

<section className="flex flex-col gap-6">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
<span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">Routing Algorithms</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Workload Distribution Strategies Deep-Dive</h2>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Deterministic Scheduling vs Stateful Adaptation</span>
</div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

<div className="p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-6">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[24px]">replay</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Round Robin Scheduling</h3>
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Cyclic Sequence Allocation</span>
</div>
</div>
<span className="px-3 py-1 bg-surface-container-low rounded-full font-label-sm text-label-sm text-on-surface font-semibold">O(1) Dispatch</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
            Iterates through available target nodes in a strict circular loop. Each subsequent request is assigned to index <code className="text-primary font-semibold font-mono">(i + 1) mod N</code>, assuming all backend instances possess identical computational capacity.
          </p>

<div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase">Mathematical Model</span>
<div className="p-3 bg-surface-container-lowest rounded-xl font-mono text-body-sm text-primary font-bold">
              Target(k) = Server[ k &amp; (N - 1) ] <span className="text-on-surface-variant font-normal">/* Power-of-2 nodes */</span><br/>
              Weighted: S(k) = argmax_(i) ( w_i / Σ w_j )
            </div>
</div>

<div className="grid grid-cols-2 gap-3 pt-2">
<div className="p-3 bg-surface-container-low rounded-xl">
<span className="font-label-sm text-label-sm text-on-surface-variant block">Ideal Workload</span>
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Uniform, idempotent, short-lived stateless queries</span>
</div>
<div className="p-3 bg-surface-container-low rounded-xl">
<span className="font-label-sm text-label-sm text-on-surface-variant block">Failure Handling</span>
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Instant index skip via periodic health probes</span>
</div>
</div>

<div className="p-4 bg-secondary-fixed/40 rounded-2xl flex items-start gap-3">
<span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">warning</span>
<p className="font-body-sm text-body-sm text-on-secondary-fixed">
<strong className="font-bold">Trade-off Vulnerability:</strong> Prone to backend CPU contention if request runtimes vary widely (e.g. 5ms cache hit vs 1200ms DB aggregation landing on the same node).
            </p>
</div>
</div>
<div className="flex items-center justify-between pt-4">
<span className="font-label-sm text-label-sm text-on-surface-variant">PLEXO Driver: <span className="font-semibold text-primary">modulo_rr_core.so</span></span>
<button className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-all">Inspect Algorithm</button>
</div>
</div>

<div className="p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-6">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[24px]">stream</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Least Connections Scheduling</h3>
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Dynamic Active-Session Tracking</span>
</div>
</div>
<span className="px-3 py-1 bg-surface-container-low rounded-full font-label-sm text-label-sm text-secondary font-semibold">Dynamic State</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
            Routes incoming traffic to the server currently maintaining the lowest count of active open connections. Essential for environments where transaction durations are stochastic and unpredictable.
          </p>

<div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase">Mathematical Model</span>
<div className="p-3 bg-surface-container-lowest rounded-xl font-mono text-body-sm text-primary font-bold">
              Target = min_(i ∈ Nodes) ( C_i / W_i )<br/>
<span className="text-on-surface-variant font-normal">Where C_i = active TCP connections, W_i = capacity weight</span>
</div>
</div>

<div className="grid grid-cols-2 gap-3 pt-2">
<div className="p-3 bg-surface-container-low rounded-xl">
<span className="font-label-sm text-label-sm text-on-surface-variant block">Ideal Workload</span>
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Persistent WebSockets, streaming video, heavy SQL batches</span>
</div>
<div className="p-3 bg-surface-container-low rounded-xl">
<span className="font-label-sm text-label-sm text-on-surface-variant block">Failure Handling</span>
<span className="font-body-sm text-body-sm text-on-surface font-semibold">TCP FIN / RST auto-decrements node active ledger</span>
</div>
</div>

<div className="p-4 bg-secondary-fixed/40 rounded-2xl flex items-start gap-3">
<span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">info</span>
<p className="font-body-sm text-body-sm text-on-secondary-fixed">
<strong className="font-bold">Trade-off Consideration:</strong> Requires distributed synchronization of connection state across multi-core proxy threads, incurring slight atomic counter lock overhead.
            </p>
</div>
</div>
<div className="flex items-center justify-between pt-4">
<span className="font-label-sm text-label-sm text-on-surface-variant">PLEXO Driver: <span className="font-semibold text-primary">weighted_lc_engine.c</span></span>
<button className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-all">Inspect Algorithm</button>
</div>
</div>
</div>
</section>

<section className="flex flex-col gap-6">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="material-symbols-outlined text-secondary text-[20px]">expand</span>
<span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">Dynamic Topology</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Scalability, Elasticity &amp; Resource Pooling</h2>
</div>
<div className="flex items-center gap-2">
<span className="px-3 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface font-medium">HPA v2 Autonomic Loop</span>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

<div className="lg:col-span-2 p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-6">
<div>
<div className="flex items-center justify-between mb-4">
<h3 className="font-title-md text-title-md text-on-surface font-bold">Autoscaling Architecture: Horizontal (Scale-Out) vs Vertical (Scale-Up)</h3>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Dynamic Orchestration</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">
            PLEXO's autoscaler dynamically adjusts cluster resources based on real-time telemetry from memory footprints, CPU utilization, and HTTP request metrics.
          </p>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="p-5 rounded-2xl bg-surface-container-low flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-primary-container font-bold">Horizontal Pod Autoscaler (HPA)</span>
<span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Replicas ±</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Adjusts replica count linearly to divide incoming traffic load among duplicate pods.</p>

<div className="p-4 bg-surface-container-lowest rounded-xl flex items-center justify-around">
<div className="flex flex-col items-center gap-1">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-primary">database</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Pod 1</span>
</div>
<span className="material-symbols-outlined text-secondary text-[18px]">add</span>
<div className="flex flex-col items-center gap-1">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-primary">database</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Pod 2</span>
</div>
<span className="material-symbols-outlined text-secondary text-[18px]">add</span>
<div className="flex flex-col items-center gap-1">
<div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-on-secondary-fixed">database</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Pod N</span>
</div>
</div>
<div className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
<span>• Scalability limit: Bound only by cloud quota &amp; subnet CIDR.</span>
<span>• Downtime: Zero downtime (rolling deployment).</span>
</div>
</div>

<div className="p-5 rounded-2xl bg-surface-container-low flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-primary-container font-bold">Vertical Pod Autoscaler (VPA)</span>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">Core/RAM ±</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Modifies CPU cores and RAM allocation directly allocated to an existing pod container.</p>

<div className="p-4 bg-surface-container-lowest rounded-xl flex items-center justify-center gap-4">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-[16px] text-on-surface-variant">memory</span>
</div>
<span className="material-symbols-outlined text-secondary text-[20px]">arrow_right_alt</span>
<div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[24px]">memory</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">2 Core → 8 Core</span>
<span className="font-label-sm text-label-sm text-primary font-bold">4GB → 32GB</span>
</div>
</div>
<div className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
<span>• Scalability limit: Bound by physical host hypervisor limits.</span>
<span>• Disruption: May require pod restart unless live in-place resizing is enabled.</span>
</div>
</div>
</div>
</div>
<div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-secondary">memory</span>
<span className="font-body-sm text-body-sm text-on-surface"><strong>Best Practice Recommendation:</strong> Use HPA for stateless API microservices; use VPA for stateful monolithic caches and local in-memory DB instances.</span>
</div>
</div>
</div>

<div className="p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-6">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[22px]">hub</span>
<h3 className="font-title-md text-title-md text-on-surface font-bold">Multi-Tenant Resource Pooling</h3>
</div>
<span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Isolation</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Multi-tenant virtualization ensures strict compute segregation, preventing "noisy neighbor" syndrome across parallel tenants.
          </p>

<div className="flex flex-col gap-3">
<div>
<div className="flex justify-between font-label-sm text-label-sm mb-1">
<span className="text-on-surface-variant">Tenant Alpha (CPU Shares: 4096)</span>
<span className="font-bold text-primary">64% Allocation</span>
</div>
<div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{"width":"64%"}}></div>
</div>
</div>
<div>
<div className="flex justify-between font-label-sm text-label-sm mb-1">
<span className="text-on-surface-variant">Tenant Beta (Memory Limit: 32 GiB)</span>
<span className="font-bold text-primary">48% Allocation</span>
</div>
<div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{"width":"48%"}}></div>
</div>
</div>
<div>
<div className="flex justify-between font-label-sm text-label-sm mb-1">
<span className="text-on-surface-variant">Tenant Gamma (Burst Quota)</span>
<span className="font-bold text-primary">15% Allocation</span>
</div>
<div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
<div className="h-full bg-secondary-fixed-dim rounded-full" style={{"width":"15%"}}></div>
</div>
</div>
</div>

<div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-2 mt-2">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[18px]">hourglass_empty</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold uppercase">Graceful Node Draining Protocol</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              When terminating a host, PLEXO issues a <code className="font-mono text-secondary font-semibold">SIGTERM</code>, stops accepting new L4 connections, waits for inflight HTTP/2 streams to drain (configurable grace period: 45s), and reroutes subsequent traffic without dropped packets.
            </p>
</div>
</div>
<div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Drain Failure Rate</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">0.0001% (Zero Fault)</span>
</div>
</div>
</div>
</section>

<section className="flex flex-col gap-6">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="material-symbols-outlined text-secondary text-[20px]">cloud_queue</span>
<span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">Cloud Paradigm</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Service &amp; Deployment Models Reference</h2>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">NIST SP 800-145 Taxonomy Integration</span>
</div>

<div className="p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col gap-6">
<div className="flex items-center justify-between">
<h3 className="font-title-md text-title-md text-on-surface font-bold">Service Models Matrix: Shared Responsibility Stack</h3>
<span className="font-label-sm text-label-sm text-on-surface-variant">Provider vs Customer Demarcation</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

<div className="p-6 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-4">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">IaaS</span>
<span className="material-symbols-outlined text-secondary text-[22px]">developer_board</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Infrastructure as a Service</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              Fundamental compute, raw storage blocks, and software-defined network (SDN) fabric. Total root operating system control.
            </p>
<div className="p-3 bg-surface-container-lowest rounded-xl flex flex-col gap-1.5 mt-2">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">PLEXO Deployments</span>
<span className="font-body-sm text-body-sm text-primary font-semibold">AWS EC2 Bare Metal, GCP Compute Engine, Bare-Metal NVMe Storage</span>
</div>
<div className="flex flex-col gap-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
<div className="flex justify-between"><span>Managed by Provider:</span> <strong className="text-on-surface">Physical Racks, Hypervisor</strong></div>
<div className="flex justify-between"><span>Customer Responsibility:</span> <strong className="text-on-surface">Guest OS, Patches, Apps</strong></div>
</div>
</div>
<span className="px-3 py-1.5 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-secondary font-semibold text-center">Maximum Operational Control</span>
</div>

<div className="p-6 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-4">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">PaaS</span>
<span className="material-symbols-outlined text-secondary text-[22px]">code</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Platform as a Service</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              Managed runtime environments where the underlying operating system, kernel patches, and runtime middleware are automated.
            </p>
<div className="p-3 bg-surface-container-lowest rounded-xl flex flex-col gap-1.5 mt-2">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">PLEXO Deployments</span>
<span className="font-body-sm text-body-sm text-primary font-semibold">Managed Kubernetes (EKS/GKE), Cloud Run, Serverless Functions</span>
</div>
<div className="flex flex-col gap-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
<div className="flex justify-between"><span>Managed by Provider:</span> <strong className="text-on-surface">OS, Runtime, Middleware</strong></div>
<div className="flex justify-between"><span>Customer Responsibility:</span> <strong className="text-on-surface">Application Code &amp; Data</strong></div>
</div>
</div>
<span className="px-3 py-1.5 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-secondary font-semibold text-center">Optimized Developer Velocity</span>
</div>

<div className="p-6 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-4">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">SaaS</span>
<span className="material-symbols-outlined text-secondary text-[22px]">dashboard_customize</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Software as a Service</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              Turnkey cloud software consumed via web browsers or native APIs. Complete provider abstraction of execution layers.
            </p>
<div className="p-3 bg-surface-container-lowest rounded-xl flex flex-col gap-1.5 mt-2">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">PLEXO Deployments</span>
<span className="font-body-sm text-body-sm text-primary font-semibold">PLEXO Cloud Monitoring UI, Datadog APM, PagerDuty Webhooks</span>
</div>
<div className="flex flex-col gap-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
<div className="flex justify-between"><span>Managed by Provider:</span> <strong className="text-on-surface">Complete Application Stack</strong></div>
<div className="flex justify-between"><span>Customer Responsibility:</span> <strong className="text-on-surface">User Access &amp; Configurations</strong></div>
</div>
</div>
<span className="px-3 py-1.5 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-secondary font-semibold text-center">Zero Infrastructure Overhead</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4">
<div className="flex flex-col gap-2">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">public</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Public Cloud</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Multi-tenant infrastructure managed by hyperscalers (AWS, Google Cloud, Azure). Elastic scalability on a pay-as-you-go cost model.
          </p>
</div>
<div className="p-2.5 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-on-surface font-semibold">
          Global Elastic Footprint
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4">
<div className="flex flex-col gap-2">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">lock</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Private Cloud</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Dedicated physical hardware operated exclusively for a single organization. Maximum regulatory compliance and air-gapped isolation.
          </p>
</div>
<div className="p-2.5 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-on-surface font-semibold">
          Strict Enterprise Isolation
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4">
<div className="flex flex-col gap-2">
<div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">sync_alt</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Hybrid Cloud</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Synchronized architecture uniting on-premise private data centers with public cloud bursts via DirectConnect or IPSec tunnels.
          </p>
</div>
<div className="p-2.5 bg-secondary-fixed/50 rounded-xl text-center font-label-sm text-label-sm text-on-secondary-fixed font-bold">
          PLEXO Recommended Default
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4">
<div className="flex flex-col gap-2">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">groups</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Community Cloud</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Shared infrastructure mutually maintained by multiple organizations with common missions, regulatory bounds, or security criteria.
          </p>
</div>
<div className="p-2.5 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-on-surface font-semibold">
          Consortium Governance
        </div>
</div>
</div>
</section>

<section className="flex flex-col gap-6">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="material-symbols-outlined text-secondary text-[20px]">security</span>
<span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">Zero-Trust Framework</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Cloud Security, IAM &amp; Secure Communications</h2>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Defense-In-Depth Architecture</span>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4 group hover:bg-surface-container-low transition-all">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[20px]">verified_user</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Pillar 1</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Authentication</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Mutual TLS (mTLS) with automated SPIFFE/SPIRE x509 cert rotation and signed ephemeral JWT assertion tokens.
          </p>
</div>
<div className="p-2 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-primary font-semibold">
          Zero-Trust Identity
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4 group hover:bg-surface-container-low transition-all">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[20px]">badge</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Pillar 2</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Role-Based RBAC</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Strict granular permission bindings. Microservice endpoints check claims against Open Policy Agent (OPA) engines.
          </p>
</div>
<div className="p-2 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-primary font-semibold">
          Least Privilege
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4 group hover:bg-surface-container-low transition-all">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Pillar 3</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">IAM Policies</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Declarative JSON IAM specifications controlling ingress proxy mutations, certificate issuance, and routing updates.
          </p>
</div>
<div className="p-2 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-primary font-semibold">
          Declarative Auditing
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4 group hover:bg-surface-container-low transition-all">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[20px]">fence</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Pillar 4</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">Network Isolation</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            VPC peering, private transit gateways, and micro-segmentation firewalls blocking uninspected lateral pod transit.
          </p>
</div>
<div className="p-2 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-primary font-semibold">
          VPC Micro-segmentation
        </div>
</div>

<div className="p-6 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col justify-between gap-4 group hover:bg-surface-container-low transition-all">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[20px]">enhanced_encryption</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Pillar 5</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface font-bold">TLS 1.3 In-Transit</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Mandatory TLS 1.3 with Perfect Forward Secrecy (PFS), ECDHE key exchange, and hardware AES-GCM acceleration.
          </p>
</div>
<div className="p-2 bg-surface-container-low rounded-xl text-center font-label-sm text-label-sm text-primary font-semibold">
          End-to-End Cryptography
        </div>
</div>
</div>

<div className="p-8 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
<div className="flex flex-col gap-3 max-w-xl">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
<span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">Automated Policy Verification</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Validate Ingress Security Against Zero-Trust Standards</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
          Simulate ingress request headers to evaluate policy pass/fail status across Layer 4 packet inspection and Layer 7 authentication barriers.
        </p>
</div>

<div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
{auditPassed && (
  <span className="px-4 py-2 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-full animate-bounce">
    Audit Passed: 100% Zero-Trust Verified
  </span>
)}
<button className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary-container hover:bg-secondary text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-all flex items-center justify-center gap-2" id="run-audit-btn" onClick={handleRunAudit} disabled={isAuditing}>
<span className={`material-symbols-outlined text-[20px] ${isAuditing ? 'animate-spin' : ''}`}>
  {isAuditing ? 'refresh' : 'play_arrow'}
</span>
          {isAuditing ? 'Validating Policies...' : 'Run Mesh Security Audit'}
        </button>
<button className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-label-lg text-label-lg font-semibold transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[20px]">download</span>
          Export Compliance Matrix
        </button>
</div>
</div>
</section>


</div>
    </div>
  );
};
