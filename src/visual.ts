import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import converterHelper = powerbi.extensibility.utils.dataview.converterHelper;

module powerbi.extensibility.visual {

    /**
     * Interface for BarCharts viewmodel.
     *
     * @interface
     * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
     * @property {number} dataMax                 - Maximum data value in the set of data points.
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
     * @property {number} value    - Data value for point.
     * @property {string} category - Coresponding category of data value.
     */
    interface BarChartDataPoint {category: string; category_num: number;};

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
        console.log(options.dataViews);
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
        let metadata = dataViews[0].metadata;
        let categories: string[] = category.values.map(d => d.toString());
        let subCategories: string[] = [];
        let barChartDataPoints = [];
        let dataMax: number = 0;
        //let colorPalette: ISandboxExtendedColorPalette = host.colorPalette;
        let objects = dataViews[0].metadata.objects;


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
        
        /*for(let k = 0, len2 = category.values.length; k < len2; k++){
            let dataPoint = {category: category.values[k]};

            for(let j = 0, len1 = categorical.values.length; j < len1; j++){
                let dataValue = categorical.values[j];
                console.log(dataValue.values);
                //const strokeWidth: number = getColumnStrokeWidth(colorPalette.isHighContrast);
                for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
                    //const color: string = getColumnColorByIndex(category, i, colorPalette);
                    dataPoint[dataValue.source.displayName] = dataValue.values[i];
                    if(stackedCategories.indexOf(dataValue.source.displayName) < 0){
                        stackedCategories.push(dataValue.source.displayName);
                    }
                    const selectionId: ISelectionId = host.createSelectionIdBuilder()
                        .withCategory(category, i)
                        .createSelectionId();
                    /*barChartDataPoints.push({
                            name: `${dataValue.source.displayName}`,
                            value: dataValue.values[i],
                            category: `${category.values[i]}`
                        });*/
                //}
            //}
            //barChartDataPoints.push(dataPoint);
        //}
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
                categories.push(series.toString());
                const selectionId: ISelectionId = host.createSelectionIdBuilder()
                    .withCategory(category, j)
                    .createSelectionId();
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
        private barChartContainer: d3.Selection<SVGElement>;
        private barContainer: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGElement>;
        private yAxis: d3.Selection<SVGElement>;
        private groups: any;
        private bars: any;

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

            let width = options.viewport.width;
            let height = options.viewport.height;

            this.svg.attr({
                width: width,
                height: height
            });
            let data = viewModel.dataPoints;

            let dataset = d3.layout.stack()(viewModel.subCategories.map(function(d){
                return data.map(function(e){
                    return {x: e.category_num, y: e[d], category: e.category, subcategory: d};
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
            this.groups = this.barContainer.selectAll("g.stackedsection")
            .data(dataset);
            this.bars = this.groups.selectAll(".bar")
            .data(function(d){ return d; });

            // Remove unused elements
            this.bars.exit().remove();
            this.groups.exit().remove();

            // Insert new elements
            this.groups.enter()
            .append('g')
            .attr("class", "stackedsection");
            
            this.bars.enter()
            .append("rect")
            .classed('bar', true);

            // Update attributes
            this.groups
            .style("fill", function(d, i) { return colors[i]; });

            this.bars
            .attr("name", function(d: any){ return d.subcategory; })
            .attr("x", function(d: any) { return xScale(d.category); })
            .attr("y", function(d: any) { return yScale(d.y0 + d.y) })
            .attr("height", function(d: any) { return yScale(d.y0) - yScale(d.y0 + d.y); })
            .attr("width", xScale.rangeBand());


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