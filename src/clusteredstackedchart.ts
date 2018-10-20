
import converterHelper = powerbi.extensibility.utils.dataview.converterHelper;

module powerbi.extensibility.visual {

    /**
     * Interface for BarCharts viewmodel.
     *
     * @interface
     * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
     * @property {number} dataMax                 - Maximum data value in the set of data points.
     * @property {string[]} categories            - List of all the categories
     * @property {string[]} subCategories         - List of all the subcategories
     */
    interface BarChartViewModel {
        dataPoints: BarChartDataPoint[];
        dataMax: number;
        categories: string[];
        subCategories: string[];
    };
    /**
     * Interface for BarChart data points.
     *
     * @interface
     * @property {string} category      - Data value category.
     * @property {number} category_num  - Category as a number.
     */
    interface BarChartDataPoint {
        category: string; 
        category_num: number;
        selectionId: ISelectionId;
    };

     /**
     * Function that converts queried data into a view model that will be used by the visual.
     *
     * @function
     * @param {VisualUpdateOptions} options - Contains references to the size of the container
     *                                        and the dataView which contains all the data
     *                                        the visual had queried.
     * @param {IVisualHost} host            - Contains references to the host which contains services
     */
    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel {
        let dataViews = options.dataViews;
        let defaultSettings = {
            enableAxis: {
                show: false,
                fill: "#000000",
            },
            generalView: {
                opacity: 100,
                showHelpLink: false,
                helpLinkColor: "#80B0E0",
            }
        };
        let viewModel: BarChartViewModel = {
            dataPoints: [],
            dataMax: 0,
            categories: [],
            subCategories: []
            //settings: <BarChartSettings>{}
        };

        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories
            || !dataViews[0].categorical.categories[0].source
            || !dataViews[0].categorical.values
        ) {
            return viewModel;
        }

        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let categories: string[] = category.values.map(d => d.toString());
        let subCategories: string[] = [];
        let barChartDataPoints = [];
        let dataMax: number = 0;
        //let colorPalette: ISandboxExtendedColorPalette = host.colorPalette;


        //const strokeColor: string = getColumnStrokeColor(colorPalette);

        /*let barChartSettings: BarChartSettings = {
            enableAxis: {
                show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
                fill: getAxisTextFillColor(objects, colorPalette, defaultSettings.enableAxis.fill),
            },
            generalView: {
                opacity: getValue<number>(objects, 'generalView', 'opacity', defaultSettings.generalView.opacity),
                showHelpLink: getValue<boolean>(objects, 'generalView', 'showHelpLink', defaultSettings.generalView.showHelpLink),
                helpLinkColor: strokeColor,
            },
        };*/
        for(let i = 0, len = categories.length; i < len; i++){
            let point = {category: categories[i], category_num: i};
            barChartDataPoints[i] = point;

            for(let j = 0, len2 = categorical.values.length; j < len2; j++)
            {
                let dataValue: number = <number>categorical.values[j].values[i];
                let series: string = converterHelper.getSeriesName(categorical.values[j].source).toString();
                if(subCategories.indexOf(series) < 0){
                    subCategories.push(series);
                }
                if(dataValue > dataMax){
                    dataMax = dataValue;
                }
                barChartDataPoints[i].selectionId = host.createSelectionIdBuilder()
                .withCategory(category, i)
                .withSeries(categorical.values, categorical.values[j])
                .createSelectionId();
                categories.push(series.toString());
                barChartDataPoints[i][series] = dataValue;
            }
        }

        return {
            dataPoints: barChartDataPoints,
            dataMax: dataMax,
            categories: categories,
            subCategories: subCategories
            //settings: barChartSettings,
        };
    }

    export class ClusteredStackedChart implements IVisual {
        private svg: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private barContainer: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGElement>;
        private yAxis: d3.Selection<SVGElement>;
        private selectionManager: ISelectionManager;

        static Config = {
            xScalePadding: 0.1,
            yScalePadding: 50,
            marginLeft: 100,
            marginTop: 10,
            marginBottom: 50
        };

        /**
         * Creates instance of BarChart. This method is only called once.
         *
         * @constructor
         * @param {VisualConstructorOptions} options - Contains references to the element that will
         *                                             contain the visual and a reference to the host
         *                                             which contains services.
         */
        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            let svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('barChart', true);

            this.barContainer = svg.append('g')
                .classed('barContainer', true);

            this.xAxis = this.svg
            .append('g')
            .classed('xAxis', true);

            this.yAxis = this.svg.append("g")
            .classed("yAxis", true);
        }

        /**
         * Updates the state of the visual. Every sequential databinding and resize will call update.
         *
         * @function
         * @param {VisualUpdateOptions} options - Contains references to the size of the container
         *                                        and the dataView which contains all the data
         *                                        the visual had queried.
         */
        public update(options: VisualUpdateOptions) {

            let viewModel: BarChartViewModel = visualTransform(options, this.host);
            let selectionManager = this.selectionManager;
            let allowInteractions = this.host.allowInteractions;
            let width = options.viewport.width;
            let height = options.viewport.height;

            this.svg.attr({
                width: width,
                height: height
            });
            let data = viewModel.dataPoints;

            let dataset = d3.layout.stack()(viewModel.subCategories.map(function(d){
                return data.map(function(e){
                    return {
                        x: e.category_num, 
                        y: e[d], 
                        category: e.category, 
                        subcategory: d,
                        selectionId: e.selectionId
                    };
                });
            }));

            let xScale = d3.scale.ordinal()
            .domain(data.map(d => d.category))
            .rangeRoundBands([ClusteredStackedChart.Config.marginLeft, (width - ClusteredStackedChart.Config.marginLeft)], ClusteredStackedChart.Config.xScalePadding);
            
            let yScale = d3.scale.linear()
            .domain([viewModel.dataMax, 0])
            .range([ClusteredStackedChart.Config.marginTop, (height - ClusteredStackedChart.Config.marginBottom)])
            .nice();

            let yAxis = d3.svg.axis()
            .scale(yScale)
            .ticks(7)
            .orient("left");

            let xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom');

            this.xAxis.attr('transform', 'translate(0, ' + (height - ClusteredStackedChart.Config.marginBottom) + ')')
            .call(xAxis);

            this.yAxis
            .attr('transform', 'translate(' + [ClusteredStackedChart.Config.marginLeft, ClusteredStackedChart.Config.marginTop] + ')')
            .call(yAxis);

            let colors = ["#b33040", "#d25c4d", "#f2b447", "#d9d574"];

            // Bind data
            let groups: any = this.barContainer.selectAll("g.stackedsection")
            .data(dataset);

            // Insert new group elements
            groups.enter()
            .append('g')
            .attr("class", "stackedsection");

            // Bind bar data
            let bars: any = groups.selectAll(".bar")
            .data(function(d){ return d; });

            // Insert new rect elements
            bars.enter()
            .append("rect")
            .classed('bar', true);

            // Update attributes
            groups
            .style("fill", function(d, i) { return colors[i]; });

            bars
            .attr("name", function(d: any){ return d.subcategory; })
            .attr("x", function(d: any) { return xScale(d.category); })
            .attr("y", function(d: any) { return yScale(d.y0 + d.y) })
            .attr("height", function(d: any) { return yScale(d.y0) - yScale(d.y0 + d.y); })
            .attr("width", xScale.rangeBand());

            bars.on('click', function(d) {
                // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
                if (allowInteractions) {
                    selectionManager.select(d.selectionId).then((ids: ISelectionId[]) => {
                        bars.attr({
                            'fill-opacity': ids.length > 0 ? 0.2 : 1
                        });
                        d3.select(this).attr({
                            'fill-opacity': 1
                        });
                    });

                    (<Event>d3.event).stopPropagation();
                }
            });

            // Remove unused elements
            bars.exit().remove();
            groups.exit().remove();


        }

        /**
         * Destroy runs when the visual is removed. Any cleanup that the visual needs to
         * do should be done here.
         *
         * @function
         */
        public destroy(): void {
            //Perform any cleanup tasks here
        }
    }
}