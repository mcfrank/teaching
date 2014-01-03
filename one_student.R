rm(list=ls())
source("helper.R")

#### STUDENT EXAMPLE FIGURE ----
pdf("~/Projects/teaching/writeup/figures/students2.pdf",width=5,height=5)
par(mfrow=c(3,3), mar=c(3,4,3,2)+0.1, oma=c(5,0,3,0)+0.1 )
# plot.beta(.5,.5,main="Beta(.5,.5)")
# plot.beta(.5,1.5,main="+H")
# plot.beta(1.5,.5,main="+T")
# 
# plot.beta(1,1,main="Beta(1,1)")
# plot.beta(1,2,main="+H")
# plot.beta(2,1,main="+T")

plot.beta(2,2,main="Beta(2,2)")
plot.beta(2,3,main="+H")
plot.beta(3,2,main="+T")

plot.beta(1,3,main="Beta(1,3)")
plot.beta(2,3,main="+H")
plot.beta(1,4,main="+T")

# plot.beta(3,2,main="Beta(2,2)")
# plot.beta(2,3,main="+H")
# plot.beta(3,2,main="+T")

dev.off()

#### EXAMPLES OF LOSS ----
# guessing loss function
student.loss(1,5,.9)

## standard information gain function, assume base distribution is
## beta (3,7)
## TODO
info.gain(1,1,2,1,3,7)
info.gain(1,1,2,1,7,3)

#### optimal teaching policy for single student, guessing ----
# need to figure out what to do based on the student's parameters

# as <- c(.1, .2, .5, 1, 2, 5)
# bs <- c(.1, .2, .5, 1, 2, 5)
## convert to mu/nu parameterization
mus <- c(.1,.3,.5,.7,.9)
nus <- c(.1,.2,.5,1,2,5)
ts <- c(0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1)

d <- data.frame()
for (mu in mus) {
  for (nu in nus) {
    a <- mu * nu
    b <- (1 - mu) * nu
    ls.neutral <- sapply(ts, function (t) {
      l <- student.loss(a,b,t)
      return(l)
    })
    
    ls.h <- sapply(ts, function (t) {
      l <- student.loss(a+1,b,t)
      return(l)
    })

    ls.t <- sapply(ts, function (t) {
      l <- student.loss(a,b+1,t)
      return(l)
    })
       
    d <- rbind(d,
               data.frame(a=a,
                          b=b,
                          mu=mu,
                          nu=nu,
                          t=rep(ts,3),
                          l=c(ls.h,ls.t,ls.neutral),
                          strategy=c(rep("H",length(ts)),
                                     rep("T",length(ts)),
                                     rep("neutral",length(ts)))))
  }
}

## compute change in loss
d <- ddply(d, .(mu,nu,t),
      function(x) {
        x$dl <- x$l - x$l[x$strategy=="neutral"]
        return(x)
      })

# pdf("~/Projects/teaching/writeup/figures/single_student_loss.pdf",width=4.5,height=4.5)
qplot(t,dl,facets=mu~nu,
      colour=strategy,group=strategy,label=strategy,
      geom="line",
      xlab="test item",
      ylab="change in loss",
      data=subset(d,strategy!="neutral")) 
#+ geom_dl(method="last.qp") 
# dev.off()

# now for a single test item (t=1)
gain <- ddply(subset(d,t==.6), .(mu,nu),
             function(x) {
                nx <- data.frame(a=x$a[1],
                                 b=x$b[1],
                                 mu= x$mu[1],
                                 nu = x$nu[1],
                                 max.gain.strategy=x$strategy[x$dl==max(x$dl)],
                                 max.gain=max(x$dl))
               return(nx)})
             
qplot(mu,max.gain,colour=nu,group=nu,
      lty=max.gain.strategy,
      geom="line",
      data=gain)

#### optimal policy for a single student - INFO THEORY VERSION ----
## for these simulations, we need a true teacher distribution
## converted to mu/nu parameterization
mus <- c(.1,.3,.5,.7,.9)
nus <- c(1)
teacher.mus <- seq(0.01,.99,.01)
teacher.nu <- 10

d <- data.frame()
for (mu in mus) {
  for (nu in nus) {
    a <- mu * nu
    b <- (1 - mu) * nu
    
    ig.max <- adply(teacher.mus, 1,
                    function (m) {
                      ig.heads <- info.gain(a+1,b,a,b,m*teacher.nu,(1-m)*teacher.nu)
                      ig.tails <- info.gain(a,b+1,a,b,m*teacher.nu,(1-m)*teacher.nu)
                      ig.max <- max(ig.heads,ig.tails)
                      x <- data.frame(a=a,
                                      b=b,
                                      mu=mu,
                                      nu=nu,
                                      teacher.mu=m,
                                      teacher.nu=teacher.nu,
                                      ig.max=ig.max,
                                      strategy=(0:1)[c(ig.heads,ig.tails)==ig.max])
                      return(x)
                    })
            
    d <- rbind(d,
               ig.max)
  }
}

## plot 
quartz()
ggplot(d,
       aes(x=teacher.mu,y=ig.max,group=nu,
           ymin=ig.max-.75,ymax=ig.max+.75)) + 
  geom_line() + 
  geom_ribbon(data=subset(d,strategy==0),
              fill="green",alpha=.25) + 
  geom_ribbon(data=subset(d,strategy==1),
              fill="red",alpha=.25) + 
  scale_x_continuous(breaks=c(0,.5,1)) + 
  facet_grid(mu~ .) +
  ylab("Information gain (nats)") +
  xlab("Teacher mu")


