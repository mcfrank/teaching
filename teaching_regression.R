rm(list=ls())
source("~/Projects/R/mcf.useful.R")
source("~/Projects/R/Teaching/helper.R")

## INDEPENDENT STRATEGY 
# now some simulations on performance across class sizes and strategies
class.sizes <- c(1,2,5,10,20)
distances <- seq(3,0,-.25)
n.sim <- 30

gs <- array(NA,dim=c(length(class.sizes),length(distances),n.sim))
for (cs in 1:length(class.sizes)) {
  print(paste("class size: ",class.sizes[cs]))
  for (d in 1:length(distances)) {
    for (i in 1:n.sim) {
      gs[cs,d,i] <- get.scores(class.sizes[cs],
                              as = -distances[d],
                              bs = distances[d])
    }
  }
}

d <- data.frame(apply(gs, c(1,2), na.mean))
names(d) <- distances
d$class.size <- class.sizes

md <- melt(d,id.vars="class.size")
names(md) <- c("class.size","distance","score")
md$class.size <- factor(md$class.size)
qplot(distance,score,colour=class.size,group=class.size,
      data=md,geom="line") + 
  ylim(c(.4,1)) + 
  geom_hline(aes(yintercept=.5),lty=2)



## STRATEGY VARIANCE WITH SINGLE STUDENT
get.scores(n.students = 1, as = -1, bs = 1, student.prior = 2,
           test.items=c(-.5,-.2,.2,.5), 
           to.plot=TRUE, verbose=FALSE)

student.priors <- c(.1, .25, .5, 1, 2, 3)
distances <- seq(1,0,-.1)
n.sim <- 100

gs <- array(NA,dim=c(length(student.priors),length(distances),n.sim))
for (sp in 1:length(student.priors)) {
  print(paste("student prior: ",student.priors[sp]))
  for (d in 1:length(distances)) {
    for (i in 1:n.sim) {
      gs[sp,d,i] <- get.scores(1,
                               as = -distances[d],
                               bs = distances[d],
                               student.prior=student.priors[sp],
                               test.items=c(-.5,-.2,.2,.5))
    }
  }
}

d <- data.frame(apply(gs==0, c(1,2), na.mean))
names(d) <- distances
d$student.prior <- student.priors

md <- melt(d,id.vars="student.prior")
names(md) <- c("student.prior","distance","score")
md$student.prior <- factor(md$student.prior)
qplot(distance,score,colour=student.prior,group=student.prior,
      data=md,geom="line") + 
  ylim(c(0,1)) + 
  geom_hline(aes(yintercept=.5),lty=2)
