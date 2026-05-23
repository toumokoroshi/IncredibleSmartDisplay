export type LayoutProbeRule = {
  allowHorizontalOverflow?: boolean;
  selector: string;
  tolerancePx?: number;
};

export type LayoutProbeResult = {
  clientHeight: number;
  clientWidth: number;
  horizontalOverflow: boolean;
  missing: boolean;
  scrollHeight: number;
  scrollWidth: number;
  selector: string;
  verticalOverflow: boolean;
};

export function collectLayoutProbeResults(rules: LayoutProbeRule[], root: ParentNode = document): LayoutProbeResult[] {
  return rules.map((rule) => {
    const element = root.querySelector<HTMLElement>(rule.selector);
    const tolerancePx = rule.tolerancePx ?? 1;

    if (!element) {
      return {
        clientHeight: 0,
        clientWidth: 0,
        horizontalOverflow: false,
        missing: true,
        scrollHeight: 0,
        scrollWidth: 0,
        selector: rule.selector,
        verticalOverflow: false,
      };
    }

    const verticalOverflow = element.scrollHeight > element.clientHeight + tolerancePx;
    const horizontalOverflow = !rule.allowHorizontalOverflow && element.scrollWidth > element.clientWidth + tolerancePx;

    return {
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      horizontalOverflow,
      missing: false,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      selector: rule.selector,
      verticalOverflow,
    };
  });
}

export function getFailedLayoutProbes(results: LayoutProbeResult[]) {
  return results.filter((result) => result.missing || result.verticalOverflow || result.horizontalOverflow);
}
