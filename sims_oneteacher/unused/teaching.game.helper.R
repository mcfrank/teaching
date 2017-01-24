## plot boundaries
plot.bound <- function (p1,p2,sd,epsilon,
                        test.sd=1,legend=FALSE,
                        title="") {
  
  xs <- seq(-5,5,.01)
  yp1 <- dnorm(xs, mean=p1, sd=sd)
  yp2 <- dnorm(xs, mean=p2, sd=sd)
  tests <- dnorm(xs, mean=0, sd=test.sd)
  
  plot(xs,rep(epsilon,length(xs)),lty=2,type="l",
       xlim=c(min(xs),max(xs)),ylim=c(0,1),bty="n",
       xlab="scale",yaxp=c(0,1,2),
       ylab="probability",main=title)
  
  lines(xs,yp1,col="red")
  lines(xs,yp2,col="blue")
  lines(xs,tests,lty=3)
  
  if (legend) {
    legend(-5,1.4,lty=c(1,1,2,3),ncol=2,bty="n",xpd="n",
           col=c("red","blue","black","black"),
           c("cat 1","cat 2","noise","test items"))
  }
}

## test whether a point works
test.point <- function(t,c,
                       p1,p2,sd,epsilon) {
  
  ps <- c(dnorm(t,mean=p1,sd=sd),dnorm(t,mean=p2,sd=sd),epsilon)
  
  score <- ps[c] / sum(ps)
  
  return(score)
}

## do test.point to many points
test.points <- function(ts,cs,ws, # test items, correct answers, weights
                        p1,p2,sd,epsilon) {
  scores <- mapply(test.point,ts,cs,
                   MoreArgs=list(p1,p2,sd,epsilon))
  score <- sum(scores * ws)
  
  return(score)
}

## do test.point to many points for each student in a class
test.points.class <- function(ts,cs,ws, # test items, correct answers, weights
                        p1,p2,sds,epsilon) {
  
  score <- array()
  for (i in 1:length(sds))  {
    scores <- mapply(test.point,ts,cs,
                     MoreArgs=list(p1,p2,sds[i],epsilon))
    score[i] <- sum(scores * ws)
  }
  
  m.score <- mean(score)
  return(m.score)
}