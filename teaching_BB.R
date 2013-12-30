rm(list=ls())
source("~/Projects/teaching/teaching/teaching_BB_helper.R")
  
## STUDENT EXAMPLE FIGURE
pdf("~/Projects/teaching/teaching/writeup/figures/students.pdf")
par(mfrow=c(3,3), mar=c(3,4,3,2)+0.1, oma=c(5,0,3,0)+0.1 )
plot.beta(.5,.5,main="beta(.5,.5)")
plot.beta(.5,1.5,main="+T")
plot.beta(1.5,.5,main="+H")

plot.beta(1,1,main="beta(1,1)")
plot.beta(1,2,main="+T")
plot.beta(2,1,main="+H")

plot.beta(2,2,main="beta(2,2)")
plot.beta(2,3,main="+T")
plot.beta(3,2,main="+H")
dev.off()



## EXAMPLES OF LOSS 
