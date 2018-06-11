
/*CHART CODE
*
*
*
*
*
*
*/
var ctx1 = document.getElementById("WorldClassBar1").getContext('2d');
var WorldClassBar1 = new Chart(ctx1, {
    type: 'bar',
    data: {
        labels: ["", ""],
        datasets: [{
            data: [0.5, 2.44],
            backgroundColor: [
                "#F4C300",
                "#F4C300"
            ],
            hoverBackgroundColor: [
                "#F4C300",
                "#F4C300"
            ],
            borderColor: [
                "#F4C300",
                "#F4C300"
            ],
            borderWidth: 0
        }]
    },
    options: {
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    display: false
                }
            }]
        }
    }
});

var ctx = document.getElementById("SecurityPie").getContext('2d');
var SecurityPie = new Chart(ctx, {
    type: 'doughnut',

    data: {
        labels: ["-", "-"],
        datasets: [{
            backgroundColor: [
                "#F4C300",
                "#333"
            ],
            hoverBackgroundColor: [
                "#F4C300",
                "#333"
            ],
            data: [75, 25]
        }]
    },
    options: {
        tooltips: {
            enabled: false
        },
        legend: {
            display: false
        },

    }
});

var ctx = document.getElementById("WorldClassPie1").getContext('2d');
var WorldClassPie1 = new Chart(ctx, {
    type: 'doughnut',

    data: {
        labels: ["Percentage Before", "Percentage Improved By", "Remaining Percentage"],
        datasets: [{
            backgroundColor: [
                "#1E6B52",
                "#A3D55D",
                "#333"
            ],
            hoverBackgroundColor: [
                "#1E6B52",
                "#A3D55D",
                "#333"
            ],
            data: [49, 23, 28]
        }]
    },
    options: {
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },

    }
});

var ctx = document.getElementById("BusinessPie1").getContext('2d');
var BusinessPie1 = new Chart(ctx, {
    type: 'doughnut',

    data: {
        labels: ["Elimated Steps", "Remaining Steps"],
        datasets: [{
            backgroundColor: [
                "#333",
                "#A3D55D"
            ],
            hoverBackgroundColor: [
                "#333",
                "#A3D55D"
            ],
            data: [8, 2]
        }]
    },
    options: {
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },

    }
});
