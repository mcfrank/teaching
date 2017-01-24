rm(list=ls())
source("teaching.game.helper.R")

################################################################
## do a systematic test of some points
ts <- seq(-5,5,.1)
cs <- as.numeric(ts > 0) + 1
ws <- dnorm(ts,mean=0,sd=1)
ws <- ws / sum(ws)
  
gsee <- test.points(ts=ts,cs=cs,ws=ws,p1=-2.5,p2=2.5,sd=.5,epsilon=.1)
bsee <- test.points(ts=ts,cs=cs,ws=ws,p1=-2.5,p2=2.5,sd=1.5,epsilon=.1)
gshe <- test.points(ts=ts,cs=cs,ws=ws,p1=-1,p2=1,sd=.5,epsilon=.1)
bshe <- test.points(ts=ts,cs=cs,ws=ws,p1=-1,p2=1,sd=1.5,epsilon=.1)

## informative diagram
par(mfrow=c(2,2))
plot.bound(p1=-2.5,p2=2.5,sd=.5,epsilon=.1,legend=TRUE,
           title=paste("good S, easy E, score:", round(gsee,digits=2)))
plot.bound(p1=-2.5,p2=2.5,sd=1.5,epsilon=.1,
           title=paste("bad S, easy E, score:", round(bsee,digits=2)))
plot.bound(p1=-1,p2=1,sd=.5,epsilon=.1,
           title=paste("good S, hard E, score:", round(gshe,digits=2)))
plot.bound(p1=-1,p2=1,sd=1.5,epsilon=.1,
           title=paste("bad S, hard E, score:", round(bshe,digits=2)))


################################################################
## now check what distances are best for different distances and sds 
ds <- seq(0,10,.1)
ss <- seq(.25,2,.25)
scores <- data.frame()

for (i in 1:length(ds)) {
  for (j in 1:length(ss)) {
    s <- test.points(ts=ts,cs=cs,ws=ws,
                     p1=-ds[i],p2=ds[i],sd=ss[j],epsilon=.1)
    scores <- rbind(scores,
                    data.frame(dist=ds[i],
                               sd=ss[j],
                               score=s))
  }
}

scores$sd <- factor(scores$sd)
qplot(dist,score,colour=sd,group=sd,label=sd,
      geom="line",
      xlab="Distance to training examples",
      ylab="Score",
      xlim=c(0,10),
      ylim=c(0,1),
      data=scores) +
  geom_dl(method="top.bumpup") + 
  theme(legend.position="none")


################################################################
## now consider the best distances for two students
ds <- seq(0,10,.1)
ss1 <- seq(.25,2,.25)
ss2 <- seq(.25,2,.25)
scores2 <- data.frame()

for (i in 1:length(ds)) {
  for (j1 in 1:length(ss1)) {
    for (j2 in 1:length(ss2)) {
      s1 <- test.points(ts=ts,cs=cs,ws=ws,
                       p1=-ds[i],p2=ds[i],sd=ss1[j1],epsilon=.1)
      s2 <- test.points(ts=ts,cs=cs,ws=ws,
                        p1=-ds[i],p2=ds[i],sd=ss2[j2],epsilon=.1)
      scores2 <- rbind(scores2,
                      data.frame(dist=ds[i],
                                 sd1=ss1[j1],
                                 sd2=ss2[j2],
                                 s1=s1,
                                 s2=s2,
                                 score=mean(c(s1,s2))))
    }
  }
}

scores2$sd1f <- factor(scores2$sd1)
scores2$sd2f <- factor(scores2$sd2)

# plot of scores of both students by sd of each
qplot(dist,score,colour=sd1f,group=sd1f,label=sd1f,
      facets= ~ sd2f,
      geom="line",
      xlab="Distance to training examples",
      ylab="Score",
      xlim=c(0,10),
      ylim=c(0,1),
      data=scores2) +
  geom_dl(method="top.bumpup") + 
  theme(legend.position="none")

# now find the best distance for each score pair
best.dists <- ddply(scores2, .(sd1,sd2),
                    function(x) {
                      d <- x$dist[x$score==max(x$score)]
                      return(data.frame(sd1=x$sd1[1],
                                        sd2=x$sd2[1],
                                        best.dist=d,
                                        score=max(x$score)))
                    })

best.dists$sd1f <- factor(best.dists$sd1)
best.dists$sd2f <- factor(best.dists$sd2)

## plot the best strategy by the two students' abilities
qplot(sd1f,sd2f,fill=best.dist,geom="tile",
      data=best.dists,
      xlab="Student 1 SD",ylab="Student 2 SD") + 
  scale_fill_gradient(low = "white",high = "steelblue")

qplot(sd1f,sd2f,fill=score,geom="tile",
      data=best.dists,
      xlab="Student 1 SD",ylab="Student 2 SD") + 
  scale_fill_gradient(low = "white",high = "steelblue")


################################################################
## consider class sizes
ds <- seq(0,10,.1)
cs <- c(1,2,5,10,20,50)
classes <- 10
scores <- data.frame()

for (i in 1:length(ds)) {
  for (j in 1:length(cs)) {
    for (k in 1:classes) {
      students <- rgamma(cs[j],shape=1,rate=1)
      
      
      s <- test.points.class(ts=ts,cs=cs,ws=ws,
                             p1=-ds[i],p2=ds[i],sds=students,epsilon=.1)
      scores <- rbind(scores,
                      data.frame(dist=ds[i],
                                 sd=ss[j],
                                 score=s))
    }
  }
}

scores$sd <- factor(scores$sd)
qplot(dist,score,colour=sd,group=sd,label=sd,
      geom="line",
      xlab="Distance to training examples",
      ylab="Score",
      xlim=c(0,10),
      ylim=c(0,1),
      data=scores) +
  geom_dl(method="top.bumpup") + 
  theme(legend.position="none")