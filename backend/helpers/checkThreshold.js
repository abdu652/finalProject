const checkThresholds = (reading, thresholds) => {
    const alerts = [];
    const { sewageLevel, methaneLevel, flowRate } = reading;
    const { maxDistance, maxGas, minFlow } = thresholds;
  
    if (sewageLevel > maxDistance) alerts.push('high_sewage');
    if (methaneLevel > maxGas) alerts.push('gas_leak');
    if (flowRate < minFlow) alerts.push('blockage_risk');
  
    return alerts.length > 0 ? alerts : null;
  };

  export default checkThresholds;