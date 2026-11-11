import React, { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboardView } from './components/views/OverviewDashboardView';
import { CloudLoadBalancingView } from './components/views/CloudLoadBalancingView';
import { ADALabView } from './components/views/ADALabView';
import { TrafficAnalyticsView } from './components/views/TrafficAnalyticsView';
import { CloudArchitectureView } from './components/views/CloudArchitectureView';
import { AboutProjectView } from './components/views/AboutProjectView';
import { ActiveTab } from './types';

function App() {
  const sim = useSimulation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const status = sim.simulationState?.status ?? 'IDLE';
  const algorithm = sim.simulationState?.config.algorithm ?? 'ROUND_ROBIN';
  const healthyCount = sim.nodes.filter(n => n.status === 'HEALTHY').length;

  // Disconnected banner
  if (!sim.isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-secondary-container border-t-secondary animate-spin" />
        <div className="text-center">
          <div className="text-primary font-bold text-lg">Connecting to Simulation Server...</div>
          <div className="text-on-surface-variant text-sm mt-1">Make sure the backend is running on port 3001</div>
          <div className="text-on-surface-variant text-xs mt-2 font-mono bg-surface-container px-3 py-1.5 rounded-full inline-block">
            cd server &amp;&amp; npm run dev
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Fixed Left Oceanic Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeNodesCount={healthyCount || sim.nodes.length}
        throughputRate={`${sim.metrics?.throughput ? (sim.metrics.throughput / 1000).toFixed(2) + ' k' : '1.42 M'} req/s`}
      />

      {/* Main Content Area Padded for Left 72 (w-72) */}
      <div className="pl-72">
        {/* Top Header */}
        <Header
          isConnected={sim.isConnected}
          status={status}
          algorithm={algorithm}
          currentRps={sim.currentRps}
          avgLatency={sim.metrics?.latency.avg}
          bannedCount={sim.bannedClients.length}
          onStart={sim.startSimulation}
          onPause={sim.pauseSimulation}
          onReset={sim.resetSimulation}
          onClusterOpsClick={() => setActiveTab('load-balancing')}
          onThreatClick={() => setActiveTab('analytics')}
        />

        {/* Dynamic View Main Container */}
        <main className="w-full pt-20 px-8 pb-12 bg-background min-h-screen">
          {activeTab === 'overview' && (
            <OverviewDashboardView
              state={sim.simulationState}
              nodes={sim.nodes}
              metrics={sim.metrics}
              onNavigate={setActiveTab}
              onStartSimulation={sim.startSimulation}
            />
          )}

          {activeTab === 'load-balancing' && (
            <CloudLoadBalancingView
              simulationState={sim.simulationState}
              nodes={sim.nodes}
              metrics={sim.metrics}
              events={sim.events}
              isSpiking={sim.isSpiking}
              onAlgorithmChange={sim.setAlgorithm}
              onTrafficUpdate={sim.updateTraffic}
              onTriggerSpike={sim.triggerSpike}
              onFailNode={sim.failNode}
              onRecoverNode={sim.recoverNode}
              onAddNode={sim.addNode}
              onRemoveNode={sim.removeNode}
              onResetSimulation={sim.resetSimulation}
              onStartSimulation={sim.startSimulation}
              onPauseSimulation={sim.pauseSimulation}
              onClearEvents={sim.clearEvents}
            />
          )}

          {activeTab === 'ada-lab' && (
            <ADALabView />
          )}

          {activeTab === 'analytics' && (
            <TrafficAnalyticsView
              nodes={sim.nodes}
              metrics={sim.metrics}
              events={sim.events}
              latencySeries={sim.latencySeries}
              throughputSeries={sim.throughputSeries}
              isSpiking={sim.isSpiking}
              bannedClients={sim.bannedClients}
              lastThreatEvaluation={sim.lastThreatEvaluation}
              onUnbanClient={sim.unbanClient}
              onClearAllBans={sim.clearAllBans}
              onSimulateAttack={sim.simulateAttack}
            />
          )}

          {activeTab === 'cloud-architecture' && (
            <CloudArchitectureView />
          )}

          {activeTab === 'about' && (
            <AboutProjectView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
